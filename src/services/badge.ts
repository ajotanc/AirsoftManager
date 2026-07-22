import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { OperatorService, type IOperator } from "./operator";
import { PaymentService } from "./payment";
import { RatingService } from "./rating";
import { VehicleService } from "./vehicle";
import { CarpoolService } from "./carpool";
import { GuestService } from "./guest";
import { ScheduleService } from "./schedule"; // Importante para missões
import { SchoolService, type SchoolCategory, type ISchoolAnswer } from "./school";
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
import { MaintenanceService } from "./maintenance";

dayjs.extend(isSameOrBefore);

export interface IBadgeDefinition {
  slug: string;
  label?: string;
  icon?: string;
  color?: string;
  description?: string;
}

const RANK_ICONS: Record<string, string> = {
  "Iniciado em Campo": "ri-medal-line",
  "Operador de Linha": "ri-medal-line",
  "Especialista Urbano": "ri-medal-line",
  "Batedor de Vanguarda": "ri-medal-line",
  "Atirador Designado": "ri-medal-line",
  "Estrategista de Setor": "ri-medal-line",
  "Lobo da Floresta": "ri-medal-line",
  "Mestre de Armas": "ri-medal-line",
  "Veterano de Elite": "ri-medal-line",
  "Sombra da Unidade": "ri-medal-line",
  "O Fantasma": "ri-medal-line",
  "Comandante de Campo": "ri-medal-line",
  "Operador Black Ops": "ri-medal-line",
  "Sentinela de Ferro": "ri-medal-line",
  "Infiltrador Mestre": "ri-medal-line",
  "Lenda do Asfalto": "ri-medal-line",
  "General de Divisão": "ri-medal-line",
  "Águia de Rapina": "ri-medal-line",
  "Titã da Unidade": "ri-medal-line",
  "Oráculo de Guerra": "ri-medal-line",
  "Guardião do Êxodo": "ri-medal-line",
  "O Mito de Platina": "ri-medal-line",
};

const SKILL_ICONS: Record<string, string> = {
  honor: "ri-honour-line",
  aim: "ri-crosshair-2-line",
  tactics: "ri-organization-chart",
  communication: "ri-speak-line",
  mobility: "ri-footprint-line",
  stealth: "ri-eye-off-line",
};

export const ALL_BADGES_DEFINITION: IBadgeDefinition[] = [
  ...[1, 2, 3, 4, 5].map((n) => ({
    slug: `rating_star_${n}`,
    label: `${n} Estrelas`,
    icon: "ri-star-line",
    color: "#fbbf24",
    description: `Graduação oficial de ${n} estrelas no time.`,
  })),
  ...LEVELS.map((l) => ({
    slug: `rank_${l.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")}`,
    label: `Patente: ${l.label}`,
    icon: RANK_ICONS[l.label],
    color: "#f59e0b",
    description: l.description,
  })),
  ...SKILL_ATTRIBUTES.map((s) => ({
    slug: `master_${s.field}`,
    label: `Mestre em ${s.header}`,
    icon: SKILL_ICONS[s.field] || "ra ra-shield",
    color: "#a78bfa",
    description: `Média de excelência em ${s.header} nos votos do time.`,
  })),
  {
    slug: "specialty_assault",
    label: "Especialista Assault",
    icon: "ri-focus-3-line",
    color: "#f87171",
    description: "Operador focado em linha de frente e progressão.",
  },
  {
    slug: "specialty_dmr",
    label: "Especialista DMR",
    icon: "ri-target-line",
    color: "#a78bfa",
    description: "Precisão e suporte a média distância.",
  },
  {
    slug: "specialty_sniper",
    label: "Especialista Sniper",
    icon: "ri-crosshair-line",
    color: "#60a5fa",
    description: "Olhos do time e eliminação de alvos críticos.",
  },
  {
    slug: "specialty_support",
    label: "Especialista Suporte",
    icon: "ri-shield-flash-line",
    color: "#fbbf24",
    description: "Supressão e volume de fogo constante.",
  },
  {
    slug: "arsenal_collector",
    label: "Colecionador",
    icon: "ri-stack-line",
    color: "#3b82f6",
    description: "Possui um arsenal com 5 ou mais equipamentos.",
  },
  {
    slug: "high_power_unit",
    label: "Força de Impacto",
    icon: "ri-fire-line",
    color: "#ef4444",
    description: "Equipamento operando acima de 400 FPS.",
  },
  {
    slug: "certified_sniper",
    label: "Sniper Certificado",
    icon: "ri-crosshair-line",
    color: "#60a5fa",
    description: "Possui armamento de categoria Sniper no arsenal.",
  },
  {
    slug: "verified_arsenal",
    label: "Arsenal Legalizado",
    icon: "ri-file-list-3-line",
    color: "#10b981",
    description: "Equipamentos com Nota Fiscal anexada ao sistema.",
  },
  {
    slug: "standard_operator",
    label: "Operador Padrão",
    icon: "ri-shield-user-line",
    color: "#22c55e",
    description: "Possui pelo menos 1 loadout completo e verificado.",
  },
  {
    slug: "tactical_chameleon",
    label: "Camaleão Tático",
    icon: "ri-palette-line",
    color: "#10b981",
    description: "Possui os 3 loadouts oficiais do time completos.",
  },
  {
    slug: "pmc_expert",
    label: "Especialista PMC",
    icon: "ri-spy-line",
    color: "#78350f",
    description: "Domina o estilo de operação Private Military Company.",
  },
  {
    slug: "active_standing",
    label: "Operador em Dia",
    icon: "ri-coins-line",
    color: "#22c55e",
    description: "Sem pendências financeiras com o time.",
  },
  {
    slug: "generous_contributor",
    label: "Doador de Metas",
    icon: "ri-hand-coin-line",
    color: "#f472b6",
    description: "Contribuiu para metas coletivas do Êxodo Airsoft.",
  },
  {
    slug: "punctual_operator",
    label: "Pontualidade Britânica",
    icon: "ri-calendar-check-line",
    color: "#10b981",
    description: "Pagamentos realizados sempre dentro do prazo.",
  },
  {
    slug: "blood_donor",
    label: "Doador de Sangue",
    icon: "ri-drop-line",
    color: "#ef4444",
    description: "Operador que contribui com o banco de sangue local.",
  },
  {
    slug: "health_protected",
    label: "Plano Ativo",
    icon: "ri-shield-cross-line",
    color: "#34d399",
    description: "Possui plano de saúde informado para emergências.",
  },
  {
    slug: "safety_first",
    label: "Segurança em Foco",
    icon: "ri-first-aid-kit-line",
    color: "#10b981",
    description: "Informações de alergias e remédios devidamente preenchidas.",
  },
  {
    slug: "emergency_ready",
    label: "Contato de Emergência",
    icon: "ri-phone-line",
    color: "#f87171",
    description: "Possui contato de emergência configurado no perfil.",
  },
  {
    slug: "social_media_elite",
    label: "Elite Digital",
    icon: "ri-instagram-line",
    color: "#e1306c",
    description: "Perfil vinculado ao Instagram para promoção do time.",
  },
  {
    slug: "terms_compliant",
    label: "Estatuto Aceito",
    icon: "ri-file-check-line",
    color: "#64748b",
    description: "Aceitou formalmente os termos e regras do time.",
  },
  {
    slug: "profile_storyteller",
    label: "Identidade Tática",
    icon: "ri-chat-quote-line",
    color: "#a78bfa",
    description: "Possui uma frase de efeito configurada no perfil.",
  },
  {
    slug: "birthday_warrior",
    label: "Aniversariante",
    icon: "ri-cake-2-line",
    color: "#f472b6",
    description: "Badge especial ativada no dia do aniversário.",
  },
  {
    slug: "camera_ready",
    label: "Fotogênico",
    icon: "ri-camera-lens-line",
    color: "#3b82f6",
    description: "Concedeu autorização para uso de imagem em mídias.",
  },
  {
    slug: "prestige_master",
    label: "Mestre Prestígio",
    icon: "ri-vip-crown-line",
    color: "#8b5cf6",
    description: "Operador que atingiu o primeiro nível de prestígio.",
  },
  {
    slug: "pioneer_member",
    label: "Membro Pioneiro",
    icon: "ri-flag-2-line",
    color: "#6366f1",
    description: "Membro que faz parte da fundação/início do projeto.",
  },
  {
    slug: "seasoned_veteran",
    label: "Veterano Calejado",
    icon: "ri-user-star-line",
    color: "#10b981",
    description: "Experiência avançada comprovada em campo.",
  },
  {
    slug: "federated_operator",
    label: "Operador Federado",
    icon: "ri-government-line",
    color: "#3b82f6",
    description: "Possui registro oficial na FDBA.",
  },
  {
    slug: "mobile_unit",
    label: "Unidade Móvel",
    icon: "ri-car-line",
    color: "#64748b",
    description: "Operador possui veículo cadastrado para o time.",
  },
  {
    slug: "logistics_specialist",
    label: "Especialista em Logística",
    icon: "ri-route-line",
    color: "#f59e0b",
    description: "Já ofereceu carona para outros membros em eventos.",
  },
  {
    slug: "hospitality_host",
    label: "Anfitrião",
    icon: "ri-user-add-line",
    color: "#22c55e",
    description: "Trouxe visitantes e novos recrutas para conhecer o time.",
  },
  {
    slug: "road_captain",
    label: "Capitão de Estrada",
    icon: "ri-steering-2-line",
    color: "#f59e0b",
    description: "Líder em caronas oferecidas para o time.",
  },
  {
    slug: "team_ambassador",
    label: "Embaixador Êxodo",
    icon: "ri-user-add-line",
    color: "#3b82f6",
    description: "Responsável por trazer novos visitantes para a Arena.",
  },
  {
    slug: "armorer_apprentice",
    label: "Aprendiz de Armeiro",
    icon: "ri-tools-line",
    color: "#94a3b8",
    description: "Realizou sua primeira manutenção técnica no sistema.",
  },
  {
    slug: "well_maintained",
    label: "Arsenal Impecável",
    icon: "ri-shield-star-line",
    color: "#10b981",
    description: "Todos os equipamentos do arsenal estão com a revisão em dia.",
  },
  {
    slug: "iron_operator",
    label: "Iron Operator",
    icon: "ri-robot-line",
    color: "#ef4444",
    description: "Conquista Lendária: Elite em Rating, Nível e Organização.",
  },
  {
    slug: "weekend_warrior",
    label: "Guerreiro de Fim de Semana",
    icon: "ri-calendar-event-line",
    color: "#10b981",
    description: "Operador com disponibilidade total para sábados e domingos.",
  },
  {
    slug: "specialized_professional",
    label: "Especialista Civil",
    icon: "ri-briefcase-line",
    color: "#6366f1",
    description: "Perfil profissional preenchido para networking no time.",
  },
  {
    slug: "blood_type_ready",
    label: "Ficha Médica Vital",
    icon: "ri-heart-pulse-line",
    color: "#ef4444",
    description:
      "Tipo sanguíneo e contato de emergência devidamente configurados.",
  },
  {
    slug: "bench_master",
    label: "Mestre da Bancada",
    icon: "ri-hammer-line",
    color: "#f59e0b",
    description: "Operador com mais de 10 manutenções concluídas no histórico.",
  },
  {
    slug: "upgrade_expert",
    label: "Especialista em Performance",
    icon: "ri-rocket-2-line",
    color: "#8b5cf6",
    description:
      "Realizou manutenções focadas em upgrades e melhoria de desempenho.",
  },
  {
    slug: "detailed_tech",
    label: "Técnico Detalhista",
    icon: "ri-file-list-2-line",
    color: "#3b82f6",
    description:
      "Preenche relatórios técnicos detalhados para o histórico do time.",
  },
  {
    slug: "combat_engineer",
    label: "Engenheiro de Combate",
    icon: "ri-settings-5-line",
    color: "#ef4444",
    description: "Possui um histórico vasto de reparos e revisões complexas.",
  },
  {
    slug: "arsenal_backup_ready",
    label: "Backup de Respeito",
    icon: "ri-shield-check-line",
    color: "#4ade80",
    description: "Possui arma secundária com manutenção em dia.",
  },
  {
    slug: "arsenal_pistolero",
    label: "Pistoleiro Nato",
    icon: "ri-sword-line",
    color: "#fbbf24",
    description:
      "Especialista em combate aproximado com múltiplas secundárias.",
  },
  {
    slug: "mission_reporter_silver",
    label: "Relator de Campo",
    icon: "ri-file-list-3-line",
    color: "#94a3b8",
    description: "Líder exemplar que mantém o histórico de missões impecável.",
  },
  {
    slug: "mission_perfect_attendance",
    label: "Assiduidade de Elite",
    icon: "ri-calendar-check-line",
    color: "#60a5fa",
    description: "Presença confirmada em todas as missões do mês.",
  },
  {
    slug: "mission_leader_gold",
    label: "Liderança de Ouro",
    icon: "ri-medal-line",
    color: "#f59e0b",
    description:
      "Líder em missões com mais de 80% de presença do time escalado.",
  },
  {
    slug: "mission_veteran",
    label: "Veterano de Missões",
    icon: "ri-medal-2-line",
    color: "#475569",
    description: "Operador experiente com mais de 20 missões no histórico.",
  },
  {
    slug: "maintenance_specialist",
    label: "Especialista em Manutenção",
    icon: "ri-settings-line",
    color: "#10b981",
    description:
      "Participou ativamente de cronogramas voltados à manutenção do campo.",
  },
];

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
    const [payments, vehicles, guests, maintenances, schedules] =
      await Promise.all([
        PaymentService.listByOperator(operator.$id),
        VehicleService.listByOperator(operator.$id),
        GuestService.listByOperator(operator.$id),
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

    if (guests.length > 0) earned.add("hospitality_host");
    if (guests.length >= 3) earned.add("team_ambassador");

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

    // 6. SCHOOL CERTIFICATIONS (Semestrais)
    const schoolAnswers = (operator.school_answers || []) as ISchoolAnswer[];
    const info = SchoolService.getSemesterInfo();
    const currentSemBadges = this.getCurrentSemesterSchoolBadgeSlugs();

    const currentCompleted = schoolAnswers
      .filter(ans => dayjs(ans.completed_at).isAfter(info.start) || dayjs(ans.completed_at).isSame(info.start))
      .map(ans => ans.category);

    if (currentCompleted.includes('fta')) earned.add(currentSemBadges.fta);
    if (currentCompleted.includes('sar')) earned.add(currentSemBadges.sar);
    if (currentCompleted.includes('rescom')) earned.add(currentSemBadges.rescom);
    if (['fta', 'sar', 'rescom'].every(cat => currentCompleted.includes(cat as SchoolCategory))) {
      earned.add(currentSemBadges.master);
    }

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

  getBadgeDefinition(slug?: string): IBadgeDefinition {
    if (!slug) {
      return {
        slug: '',
        label: undefined,
        icon: 'ri-question-line',
        color: '#94a3b8',
        description: ''
      };
    }

    const staticBadge = ALL_BADGES_DEFINITION.find((b) => b.slug === slug);
    if (staticBadge) return staticBadge;

    // Resolução dinâmica para certificações semestrais da Escola
    let match = slug.match(/^school_certified_fta_(\d{4})_(\d)$/);
    if (match) {
      return {
        slug,
        label: `Certificado FTA ${match[1]}.${match[2]}`,
        icon: "ri-shield-check-line",
        color: "#3b82f6",
        description: `Aprovado na certificação semestral de Fundamentos Táticos de Airsoft (${match[1]}.${match[2]}).`
      };
    }

    match = slug.match(/^school_certified_sar_(\d{4})_(\d)$/);
    if (match) {
      return {
        slug,
        label: `Certificado SAR ${match[1]}.${match[2]}`,
        icon: "ri-first-aid-kit-line",
        color: "#ef4444",
        description: `Aprovado na certificação semestral de Busca, Salvamento e Resgate (${match[1]}.${match[2]}).`
      };
    }

    match = slug.match(/^school_certified_rescom_(\d{4})_(\d)$/);
    if (match) {
      return {
        slug,
        label: `Certificado RESCOM ${match[1]}.${match[2]}`,
        icon: "ri-radio-2-line",
        color: "#f59e0b",
        description: `Aprovado na certificação semestral de Comunicação e Resposta (${match[1]}.${match[2]}).`
      };
    }

    match = slug.match(/^school_tactical_master_(\d{4})$/);
    if (match) {
      return {
        slug,
        label: `Mestre Tático ${match[1]}`,
        icon: "ri-graduation-cap-line",
        color: "#8b5cf6",
        description: `Conquista Anual ${match[1]}: Certificado com excelência em todas as matérias táticas da Escola Êxodo.`
      };
    }

    return {
      slug,
      label: undefined,
      icon: 'ri-question-line',
      color: '#94a3b8',
      description: ''
    };
  },

  getCurrentSemesterSchoolBadgeSlugs() {
    const info = SchoolService.getSemesterInfo();
    const semSlug = info.label.replace('.', '_');
    const yearSlug = String(info.start.year());

    const fta = `school_certified_fta_${semSlug}`;
    const sar = `school_certified_sar_${semSlug}`;
    const rescom = `school_certified_rescom_${semSlug}`;
    const master = `school_tactical_master_${yearSlug}`;

    return {
      fta,
      sar,
      rescom,
      master,
      all: [fta, sar, rescom, master]
    };
  },

  getDisplayedBadgesForOperator(earnedBadges: string[] = []): IBadgeDefinition[] {
    const map = new Map<string, IBadgeDefinition>();
    ALL_BADGES_DEFINITION.forEach((b) => map.set(b.slug, b));

    const currentSemBadges = this.getCurrentSemesterSchoolBadgeSlugs();
    currentSemBadges.all.forEach((slug) => {
      if (!map.has(slug)) {
        map.set(slug, this.getBadgeDefinition(slug));
      }
    });

    earnedBadges.forEach((slug) => {
      if (!map.has(slug)) {
        const def = this.getBadgeDefinition(slug);
        if (def && def.label) {
          map.set(slug, def);
        }
      }
    });

    return Array.from(map.values());
  }
};
