import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { OperatorService, type IOperator } from "./operator";
import { PaymentService } from "./payment";
import { RatingService } from "./rating";
import { VehicleService } from "./vehicle";
import { CarpoolService } from "./carpool"; // Importado para logística
import { VisitorService } from "./visitor"; // Importado para hospitalidade
import {
  UNIFORM_IDS,
  LOADOUT_ITEMS,
  LEVELS,
  CATEGORIES,
  PMC_EXCEPTIONS,
  SKILL_ATTRIBUTES,
  MIN_COMPLETE_UNIFORMS,
  EXPERIENCE_PER_LEVEL,
  MIN_VOTES_REQUIRED
} from "@/constants/airsoft";

dayjs.extend(isSameOrBefore);

export const BadgeService = {
  async syncOperatorBadges(operator: IOperator): Promise<IOperator> {
    const oldBadges = operator.badges || [];
    const earned = new Set<string>(operator.badges || []);
    const now = dayjs();

    // 1. RANKS, RATINGS & SPECIALTIES
    if (operator.rating >= 1) earned.add(`rating_star_${operator.rating}`);
    const rank = LEVELS.find(l => operator.level >= l.min && operator.level <= l.max);
    if (rank) earned.add(`rank_${rank.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_')}`);

    if (operator.category) {
      const spec = CATEGORIES[operator.category as keyof typeof CATEGORIES]?.toLowerCase();
      if (spec) earned.add(`specialty_${spec}`);
    }

    // 2. SKILL MASTERY (Radar)
    const ratings = await RatingService.getRatingsForTarget(operator.$id);
    if (ratings.total > 0) {
      const skillSums: Record<string, number> = {};

      ratings.rows.forEach(r => {
        const attr = JSON.parse(r.attributes || '{}');
        Object.keys(attr).forEach(k => skillSums[k] = (skillSums[k] || 0) + attr[k]);
      });

      SKILL_ATTRIBUTES.forEach(s => {
        const sum = skillSums[s.field] || 0;
        const total = ratings.total;

        if (total > 0) {
          const realAverage = sum / total;
          const confidenceFactor = Math.min(total / MIN_VOTES_REQUIRED, 1);
          const weightedScore = realAverage * confidenceFactor;

          if (weightedScore >= 4.5) {
            earned.add(`master_${s.field}`);
          }
        }
      });
    }

    // 3. ARSENAL & LOADOUT
    const arsenal = operator.arsenal || [];
    // Ajustado para 5 equipamentos conforme airsoft.ts
    if (arsenal.length >= 5) earned.add('arsenal_collector');
    if (arsenal.some(a => (a.fps || 0) > 400)) earned.add('high_power_unit');
    if (arsenal.some(a => a.category === 3)) earned.add('certified_sniper');
    if (arsenal.some(a => a.invoice)) earned.add('verified_arsenal');
    if (arsenal.some(a => a.maintenance_at)) earned.add('armorer_apprentice');

    // Nova: Arsenal Impecável (Toda a frota com revisão em dia)
    if (arsenal.length > 0 && arsenal.every(a => !!a.maintenance_at)) earned.add('well_maintained');

    const loadouts = operator.loadout || [];
    const coreKeys = LOADOUT_ITEMS.filter(i => !i.optional).map(i => i.key);
    const completeSets = loadouts.filter(l => coreKeys.every(k => l[k as keyof typeof l] === true));

    if (completeSets.length >= 1) earned.add('standard_operator');
    if (completeSets.length >= MIN_COMPLETE_UNIFORMS) earned.add('tactical_chameleon');

    const pmc = loadouts.some(l => l.type_uniform === UNIFORM_IDS.PMC && coreKeys.every(k => PMC_EXCEPTIONS.includes(k) ? true : l[k as keyof typeof l] === true));
    if (pmc) earned.add('pmc_expert');

    // 4. FINANCIAL & LOGISTICS
    // Buscamos veículos e visitantes primeiro
    const [payments, vehicles, visitors] = await Promise.all([
      PaymentService.listByOperator(operator.$id),
      VehicleService.listByOperator(operator.$id),
      VisitorService.listByOperator(operator.$id)
    ]);

    if (payments.length > 0 && !payments.some(p => p.status === 'pending' && dayjs(p.due_date).isBefore(now))) earned.add('active_standing');
    if (payments.some(p => p.category === 'goal' && p.status === 'paid')) earned.add('generous_contributor');
    if (payments.some(p => p.status === 'paid' && p.due_date && dayjs(p.$updatedAt).isSameOrBefore(dayjs(p.due_date)))) earned.add('punctual_operator');

    // Lógica Tática de Logística (Caronas por Veículo)
    if (vehicles.length > 0) {
      earned.add('mobile_unit');
      const vehicleIds = vehicles.map(v => v.$id);
      const carpools = await CarpoolService.listByVehicles(vehicleIds);

      if (carpools.length > 0) earned.add('logistics_specialist');
      if (carpools.length >= 5) earned.add('road_captain');
    }

    // Hospitalidade (Visitantes)
    if (visitors.length > 0) earned.add('hospitality_host');
    if (visitors.length >= 3) earned.add('team_ambassador');

    // 5. PERSONAL, HEALTH & LEGACY
    if (operator.is_donor) earned.add('blood_donor');
    if (operator.health_plan) earned.add('health_protected');
    if (operator.number_fdba) earned.add('federated_operator');
    if (operator.allergies?.length || operator.medication_details?.length) earned.add('safety_first');
    if (operator.instagram) earned.add('social_media_elite');
    if (operator.media_consent) earned.add('camera_ready');
    if (operator.prestige > 0) earned.add('prestige_master');
    if (operator.birth_date && dayjs(operator.birth_date).format('MM-DD') === now.format('MM-DD')) earned.add('birthday_warrior');
    if (operator.$createdAt && dayjs(operator.$createdAt).isBefore(dayjs('2025-07-01'))) earned.add('pioneer_member');

    // Novas condições baseadas no Perfil
    if (operator.terms_accepted) earned.add('terms_compliant');
    if (operator.quote) earned.add('profile_storyteller');
    if (operator.experience === 3) earned.add('seasoned_veteran');
    if (operator.emergency_contact) earned.add('emergency_ready');
    if (operator.availability === 'both') earned.add('weekend_warrior');
    if (operator.profession) earned.add('specialized_professional');
    if (operator.blood_type && operator.emergency_contact) earned.add('blood_type_ready');

    // --- IRON OPERATOR ---
    const isProfileFull = !!(operator.name && operator.blood_type && operator.emergency_contact);
    if (operator.level >= 10 && operator.rating === 5 && isProfileFull) earned.add('iron_operator');

    // PERSISTENCE & XP EVOLUTION
    const finalBadges = Array.from(earned);
    const newBadgesCount = finalBadges.filter(b => !oldBadges.includes(b)).length;

    if (newBadgesCount > 0) {
      return await this.addActivityXp(operator, 50 * newBadgesCount, finalBadges);
    }

    return operator;
  },
  async addActivityXp(operator: IOperator, amount: number, newBadges?: string[]): Promise<IOperator> {
    const XP_MAX_LEVEL = 100 * EXPERIENCE_PER_LEVEL; // 20.000 XP (Nível 100)

    let totalXp = (operator.xp || 0) + amount;
    let prestige = operator.prestige || 0;
    const earned = new Set<string>(newBadges || operator.badges || []);

    while (totalXp >= XP_MAX_LEVEL) {
      prestige++;
      totalXp -= XP_MAX_LEVEL;
      earned.add('prestige_master');
    }

    const level = Math.floor(totalXp / EXPERIENCE_PER_LEVEL) + 1;

    return await OperatorService.update(operator.$id, {
      xp: totalXp,
      level: level > 100 ? 100 : level,
      prestige: prestige,
      badges: Array.from(earned)
    } as IOperator);
  },
};