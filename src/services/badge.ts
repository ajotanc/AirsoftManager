import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { OperatorService, type IOperator } from "./operator";
import { PaymentService } from "./payment";
import { RatingService } from "./rating";
import { VehicleService } from "./vehicle";
// import { CarpoolService } from "./carpool";
// import { VisitorService } from "./visitor";
import {
  UNIFORM_IDS,
  LOADOUT_ITEMS,
  LEVELS,
  CATEGORIES,
  PMC_EXCEPTIONS,
  SKILL_ATTRIBUTES
} from "@/constants/airsoft";

dayjs.extend(isSameOrBefore);

export const BadgeService = {
  async syncOperatorBadges(operator: IOperator): Promise<IOperator> {
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
        if ((skillSums[s.field]! / ratings.total) >= 4.5) earned.add(`master_${s.field}`);
      });
    }

    // 3. ARSENAL & LOADOUT
    const arsenal = operator.arsenal || [];
    if (arsenal.length >= 5) earned.add('arsenal_collector');
    if (arsenal.some(a => (a.fps || 0) > 400)) earned.add('high_power_unit');
    if (arsenal.some(a => a.category === 3)) earned.add('certified_sniper');
    if (arsenal.some(a => a.invoice)) earned.add('verified_arsenal');

    // --- MAINTENANCE ---
    const hasMaintenance = arsenal.some(a => a.maintained_at);
    if (hasMaintenance) earned.add('armorer_apprentice');

    const loadouts = operator.loadout || [];
    const coreKeys = LOADOUT_ITEMS.filter(i => !i.optional).map(i => i.key);
    const completeSets = loadouts.filter(l => coreKeys.every(k => l[k as keyof typeof l] === true));
    if (completeSets.length >= 1) earned.add('standard_operator');
    if (completeSets.length >= 3) earned.add('tactical_chameleon');

    const pmc = loadouts.some(l => l.type_uniform === UNIFORM_IDS.PMC && coreKeys.every(k => PMC_EXCEPTIONS.includes(k) ? true : l[k as keyof typeof l] === true));
    if (pmc) earned.add('pmc_expert');

    // 4. FINANCIAL & LOGISTICS
    const [payments, vehicles] = await Promise.all([
      PaymentService.listByOperator(operator.$id),
      VehicleService.listByOperator(operator.$id),
      // CarpoolService.listByOperator(operator.$id),
      // VisitorService.listByOperator(operator.$id)
    ]);

    if (payments.length > 0 && !payments.some(p => p.status === 'pending' && dayjs(p.due_date).isBefore(now))) earned.add('active_standing');
    if (payments.some(p => p.category === 'goal' && p.status === 'paid')) earned.add('generous_contributor');
    if (payments.some(p => p.status === 'paid' && p.due_date && dayjs(p.$updatedAt).isSameOrBefore(dayjs(p.due_date)))) earned.add('punctual_operator');

    if (vehicles.length > 0) earned.add('mobile_unit');

    // if (carpools.length > 0) earned.add('logistics_specialist');
    // if (carpools.length >= 5) earned.add('road_captain');

    // if (visitors.length > 0) earned.add('hospitality_host');
    // if (visitors.length >= 3) earned.add('team_ambassador');


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

    // --- IRON OPERATOR (The Challenge) ---
    const isProfileFull = !!(operator.name && operator.blood_type && operator.emergency_contact);
    if (operator.level >= 10 && operator.rating === 5 && isProfileFull) {
      earned.add('iron_operator');
    }

    // PERSISTENCE
    const finalBadges = Array.from(earned);
    if (finalBadges.length !== (operator.badges?.length || 0)) {
      return await OperatorService.update(operator.$id, { ...operator, badges: finalBadges } as IOperator);
    }

    return operator;
  }
};