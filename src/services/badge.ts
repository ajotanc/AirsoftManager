import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { OperatorService, type IOperator } from "./operator";
import { PaymentService } from "./payment";
import { RatingService } from "./rating";
import { VehicleService } from "./vehicle";
import { CarpoolService } from "./carpool";
import { VisitorService } from "./visitor";
import { ScheduleService } from "./schedule"; // Importante para missões
import {
  UNIFORM_IDS,
  LOADOUT_ITEMS,
  LEVELS,
  CATEGORIES,
  PMC_EXCEPTIONS,
  SKILL_ATTRIBUTES,
  MIN_COMPLETE_UNIFORMS,
  EXPERIENCE_PER_LEVEL,
  MIN_VOTES_REQUIRED,
} from "@/constants/airsoft";
import { MaintenanceService } from "./maintenance";

dayjs.extend(isSameOrBefore);

export const BadgeService = {
  async syncOperatorBadges(operator: IOperator): Promise<IOperator> {
    const oldBadges = operator.badges || [];
    const earned = new Set<string>(operator.badges || []);
    const now = dayjs();

    // 1. RANKS, RATINGS & SPECIALTIES
    if (operator.rating >= 1) earned.add(`rating_star_${operator.rating}`);
    const rank = LEVELS.find(
      (l) => operator.level >= l.min && operator.level <= l.max,
    );
    if (rank)
      earned.add(
        `rank_${rank.label
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_")}`,
      );

    if (operator.category) {
      const spec =
        CATEGORIES[operator.category as keyof typeof CATEGORIES]?.toLowerCase();
      if (spec) earned.add(`specialty_${spec}`);
    }

    // 2. SKILL MASTERY (Radar)
    const ratings = await RatingService.getRatingsForTarget(operator.$id);
    if (ratings.total > 0) {
      const skillSums: Record<string, number> = {};
      ratings.rows.forEach((r) => {
        const attr = JSON.parse(r.attributes || "{}");
        Object.keys(attr).forEach(
          (k) => (skillSums[k] = (skillSums[k] || 0) + attr[k]),
        );
      });

      SKILL_ATTRIBUTES.forEach((s) => {
        const total = ratings.total;
        if (total > 0) {
          const weightedScore =
            (skillSums[s.field] || 0 / total) *
            Math.min(total / MIN_VOTES_REQUIRED, 1);
          if (weightedScore >= 4.5) earned.add(`master_${s.field}`);
        }
      });
    }

    // 3. ARSENAL & LOADOUT
    const arsenal = operator.arsenal || [];
    if (arsenal.length >= 5) earned.add("arsenal_collector");
    if (arsenal.some((a) => (a.fps || 0) > 400)) earned.add("high_power_unit");
    if (arsenal.some((a) => a.category === 3)) earned.add("certified_sniper");
    if (arsenal.some((a) => a.invoice)) earned.add("verified_arsenal");
    if (arsenal.some((a) => a.maintenance_at)) earned.add("armorer_apprentice");
    if (arsenal.length > 0 && arsenal.every((a) => !!a.maintenance_at))
      earned.add("well_maintained");

    // --- NOVOS: ARSENAL SECUNDÁRIO ---
    const secondaries = arsenal.filter((a) => a.is_secondary);
    if (
      secondaries.some(
        (s) =>
          s.maintenance_at && now.diff(dayjs(s.maintenance_at), "day") <= 30,
      )
    )
      earned.add("arsenal_backup_ready");
    if (secondaries.length >= 2) earned.add("arsenal_pistolero");

    const loadouts = operator.loadout || [];
    const coreKeys = LOADOUT_ITEMS.filter((i) => !i.optional).map((i) => i.key);
    const completeSets = loadouts.filter((l) =>
      coreKeys.every((k) => l[k as keyof typeof l] === true),
    );
    if (completeSets.length >= 1) earned.add("standard_operator");
    if (completeSets.length >= MIN_COMPLETE_UNIFORMS)
      earned.add("tactical_chameleon");

    const pmc = loadouts.some(
      (l) =>
        l.type_uniform === UNIFORM_IDS.PMC &&
        coreKeys.every((k) =>
          PMC_EXCEPTIONS.includes(k) ? true : l[k as keyof typeof l] === true,
        ),
    );
    if (pmc) earned.add("pmc_expert");

    // 4. FINANCIAL, LOGISTICS, MAINTENANCE & SCHEDULES
    const [payments, vehicles, visitors, maintenances, schedules] =
      await Promise.all([
        PaymentService.listByOperator(operator.$id),
        VehicleService.listByOperator(operator.$id),
        VisitorService.listByOperator(operator.$id),
        MaintenanceService.listByOperator(operator.$id),
        ScheduleService.list(),
      ]);

    if (
      payments.length > 0 &&
      !payments.some(
        (p) => p.status === "pending" && dayjs(p.due_date).isBefore(now),
      )
    )
      earned.add("active_standing");
    if (payments.some((p) => p.category === "goal" && p.status === "paid"))
      earned.add("generous_contributor");
    if (
      payments.some(
        (p) =>
          p.status === "paid" &&
          p.due_date &&
          dayjs(p.$updatedAt).isSameOrBefore(dayjs(p.due_date)),
      )
    )
      earned.add("punctual_operator");

    if (vehicles.length > 0) {
      earned.add("mobile_unit");
      const carpools = await CarpoolService.listByVehicles(
        vehicles.map((v) => v.$id),
      );
      if (carpools.length > 0) earned.add("logistics_specialist");
      if (carpools.length >= 5) earned.add("road_captain");
    }

    if (visitors.length > 0) earned.add("hospitality_host");
    if (visitors.length >= 3) earned.add("team_ambassador");

    const maintenanceCompleted = maintenances.filter(
      (m) => m.status === "completed",
    );
    if (maintenanceCompleted.length >= 10) earned.add("bench_master");
    if (maintenanceCompleted.length >= 25) earned.add("combat_engineer");
    if (
      maintenanceCompleted.some(
        (m) => Array.isArray(m.type) && m.type.includes("upgrade"),
      )
    )
      earned.add("upgrade_expert");
    if (
      maintenanceCompleted.some(
        (m) => m.technical_report && m.technical_report.length > 100,
      )
    )
      earned.add("detailed_tech");

    // --- NOVOS: CRONOGRAMAS (MISSÕES) ---
    const completedSchedules = schedules.filter(
      (s) => s.status === "completed",
    );
    const myAttendance = completedSchedules.filter((s) =>
      s.attended?.includes(operator.$id),
    );

    // 80º Badge: Veterano de Missões (20+ missões participadas)
    if (myAttendance.length >= 20) earned.add("mission_veteran");

    // Relator de Campo (Líder em 5 missões com relatório > 50 caracteres)
    const reportsAsLeader = completedSchedules.filter(
      (s) => s.leader?.$id === operator.$id && s.report && s.report.length > 50,
    ).length;
    if (reportsAsLeader >= 5) earned.add("mission_reporter_silver");

    // Assiduidade de Elite (4 missões no mês atual)
    const monthAttendance = myAttendance.filter((s) =>
      dayjs(s.date).isSame(now, "month"),
    ).length;
    if (monthAttendance >= 4) earned.add("mission_perfect_attendance");

    // Liderança de Ouro (Líder em 3 missões com >80% de presença do time escalado)
    const goldLeadership = completedSchedules.filter((s) => {
      if (s.leader?.$id !== operator.$id) return false;
      return (
        s.operators &&
        s.attended &&
        s.attended.length / s.operators.length >= 0.8
      );
    }).length;
    if (goldLeadership >= 3) earned.add("mission_leader_gold");

    // 5. PERSONAL, HEALTH & LEGACY
    if (operator.is_donor) earned.add("blood_donor");
    if (operator.health_plan) earned.add("health_protected");
    if (operator.number_fdba) earned.add("federated_operator");
    if (operator.allergies?.length || operator.medication_details?.length)
      earned.add("safety_first");
    if (operator.instagram) earned.add("social_media_elite");
    if (operator.media_consent) earned.add("camera_ready");
    if (operator.prestige > 0) earned.add("prestige_master");
    if (
      operator.birth_date &&
      dayjs(operator.birth_date).format("MM-DD") === now.format("MM-DD")
    )
      earned.add("birthday_warrior");
    if (
      operator.$createdAt &&
      dayjs(operator.$createdAt).isBefore(dayjs("2025-07-01"))
    )
      earned.add("pioneer_member");
    if (operator.terms_accepted) earned.add("terms_compliant");
    if (operator.quote) earned.add("profile_storyteller");
    if (operator.experience === 3) earned.add("seasoned_veteran");
    if (operator.emergency_contact) earned.add("emergency_ready");
    if (operator.availability === "both") earned.add("weekend_warrior");
    if (operator.profession) earned.add("specialized_professional");
    if (operator.blood_type && operator.emergency_contact)
      earned.add("blood_type_ready");

    const isProfileFull = !!(
      operator.name &&
      operator.blood_type &&
      operator.emergency_contact
    );
    if (operator.level >= 10 && operator.rating === 5 && isProfileFull)
      earned.add("iron_operator");

    // FINALIZAÇÃO E XP
    const finalBadges = Array.from(earned);
    const newBadgesCount = finalBadges.filter(
      (b) => !oldBadges.includes(b),
    ).length;
    if (newBadgesCount > 0)
      return await this.addActivityXp(
        operator,
        50 * newBadgesCount,
        finalBadges,
      );

    return operator;
  },

  async addActivityXp(
    operator: IOperator,
    amount: number,
    newBadges?: string[],
  ): Promise<IOperator> {
    let totalXp = (operator.xp || 0) + amount;
    let prestige = operator.prestige || 0;
    const earned = new Set<string>(newBadges || operator.badges || []);

    while (totalXp >= 100 * EXPERIENCE_PER_LEVEL) {
      prestige++;
      totalXp -= 100 * EXPERIENCE_PER_LEVEL;
      earned.add("prestige_master");
    }

    return await OperatorService.update(operator.$id, {
      xp: totalXp,
      level: Math.min(Math.floor(totalXp / EXPERIENCE_PER_LEVEL) + 1, 100),
      prestige: prestige,
      badges: Array.from(earned),
    } as IOperator);
  },
};
