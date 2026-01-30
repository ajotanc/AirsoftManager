import type { ChartOptions, ChartData, TooltipItem } from "chart.js";

export const TEAM_NAME = import.meta.env.VITE_TEAM_NAME;
export const TEAM_TAG = import.meta.env.VITE_TEAM_TAG;
export const TEAM_MOTTO = import.meta.env.VITE_TEAM_MOTTO;
export const MONTHLY_FEE = Number.parseFloat(import.meta.env.VITE_MONTHLY_FEE);
export const DUE_DATE = Number.parseInt(import.meta.env.VITE_DUE_DATE, 10);

export const MIN_COMPLETE_UNIFORMS = 3;
export const EXPERIENCE_PER_LEVEL = 200;
export const MIN_VOTES_REQUIRED = 8;

export const EVENT_TYPES = {
  1: "Jogo",
  2: "Evento",
  3: "Manutenção",
  4: "Curso",
  5: "Reunião",
  6: "Outros",
};

export const XP_VALUES = {
  GAME: 100, // Jogo normal
  MAINTENANCE: 200, // Manutenção de campo/equipamento
  PRESENCE: 25, // Reunião ou presença rápida
  COURSE: 400, // Cursos e treinamentos oficiais
};

export const LEVELS = [
  {
    min: 1,
    max: 5,
    label: "Iniciado em Campo",
    description: "Aprendendo os fundamentos da operação.",
  },
  {
    min: 6,
    max: 10,
    label: "Operador de Linha",
    description: "Já conhece o terreno e executa ordens com precisão.",
  },
  {
    min: 11,
    max: 15,
    label: "Especialista Urbano",
    description: "Domina táticas de CQB e progressão em grupo.",
  },
  {
    min: 16,
    max: 20,
    label: "Batedor de Vanguarda",
    description: "O primeiro a entrar, o último a sair.",
  },
  {
    min: 21,
    max: 25,
    label: "Atirador Designado",
    description: "Precisão absoluta em distâncias críticas.",
  },
  {
    min: 26,
    max: 30,
    label: "Estrategista de Setor",
    description: "Capaz de coordenar pequenas esquadras em combate.",
  },
  {
    min: 31,
    max: 35,
    label: "Lobo da Floresta",
    description: "Especialista em camuflagem e operações de longa duração.",
  },
  {
    min: 36,
    max: 40,
    label: "Mestre de Armas",
    description: "Conhecimento total de mecânica e balística.",
  },
  {
    min: 41,
    max: 45,
    label: "Veterano de Elite",
    description: "Resiliência testada em inúmeras missões.",
  },
  {
    min: 46,
    max: 49,
    label: "Sombra da Unidade",
    description: "Invisível para o inimigo, letal para o objetivo.",
  },
  {
    min: 50,
    max: 50,
    label: "O Fantasma",
    description: "A lenda viva do time. Sua presença altera o rumo da missão.",
  },
  {
    min: 51,
    max: 55,
    label: "Comandante de Campo",
    description: "Visão tática privilegiada. Líder nato sob fogo cruzado.",
  },
  {
    min: 56,
    max: 60,
    label: "Operador Black Ops",
    description: "Especialista em missões de alto risco onde falhar não é opção.",
  },
  {
    min: 61,
    max: 65,
    label: "Sentinela de Ferro",
    description: "Uma barreira inquebrável. Defende o objetivo com maestria absoluta.",
  },
  {
    min: 66,
    max: 70,
    label: "Infiltrador Mestre",
    description: "Capaz de desmantelar qualquer defesa inimiga por dentro.",
  },
  {
    min: 71,
    max: 75,
    label: "Lenda do Asfalto",
    description: "Experiência forjada em anos de CQB intenso e urbano.",
  },
  {
    min: 76,
    max: 80,
    label: "General de Divisão",
    description: "Sua autoridade e conhecimento são respeitados por todo o comando.",
  },
  {
    min: 81,
    max: 85,
    label: "Águia de Rapina",
    description: "Sempre um passo à frente. Antecipa o inimigo antes do contato.",
  },
  {
    min: 86,
    max: 90,
    label: "Titã da Unidade",
    description: "Uma força da natureza em campo. Temido por qualquer adversário.",
  },
  {
    min: 91,
    max: 95,
    label: "Oráculo de Guerra",
    description: "Mestre em inteligência. Cada tiro é um passo para a vitória certa.",
  },
  {
    min: 96,
    max: 99,
    label: "Guardião do Êxodo",
    description: "O protetor máximo da honra e dos valores do time.",
  },
  {
    min: 100,
    max: 100,
    label: "O Mito de Platina",
    description: "O topo absoluto. Ninguém superou seus feitos. Uma inspiração para todos.",
  },
];

export const calculateLevel = (xp: number) => {
  const level = Math.floor(xp / EXPERIENCE_PER_LEVEL) + 1;
  return level > 100 ? 100 : level;
};

export const WEAPON_TYPES = {
  1: "AEG",
  2: "Spring",
  3: "GBB/GBBR",
  4: "HPA",
};

export const WEAPON_TYPES_OPTIONS = Object.entries(WEAPON_TYPES).map(
  ([index, label]) => ({
    label,
    value: Number.parseInt(index),
  })
);

export const CATEGORIES = {
  1: "Assault",
  2: "DMR",
  3: "Sniper",
  4: "Support",
};

export const CATEGORIES_OPTIONS = Object.entries(CATEGORIES).map(
  ([index, label]) => ({
    label,
    value: Number.parseInt(index),
  })
);

export const UNIFORM_IDS = {
  MULTICAM: 1,
  VERDE_MILITAR: 2,
  PMC: 3,
} as const;

export const UNIFORMS = {
  [UNIFORM_IDS.MULTICAM]: "Multicam",
  [UNIFORM_IDS.VERDE_MILITAR]: "Verde Militar",
  [UNIFORM_IDS.PMC]: "PMC",
};

export const UNIFORMS_OPTIONS = Object.entries(UNIFORMS).map(
  ([index, label]) => ({
    label,
    value: Number.parseInt(index),
  })
);

export const PMC_EXCEPTIONS = ["helmet", "ski_mask", "headset"];

export const ROLES = [
  { label: "Administrador", value: "admin" },
  { label: "Armaria", value: "armorer" },
  { label: "Gestão Administrativa", value: "administrative" },
  { label: "Financeiro", value: "financial" },
  { label: "Eventos", value: "event" },
  { label: "Comunicação & Mídias", value: "media" },
  { label: "Operador", value: "operator" },
  { label: "Recruta", value: "recruit" },
  { label: "Padrão & Equipamentos", value: "uniform" },
];

export const SHIRT_SIZES = ["PP", "P", "M", "G", "GG", "XG"];
export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const EXPERIENCES = [
  { label: "Básico", value: 1 },
  { label: "Intermediário", value: 2 },
  { label: "Avançado", value: 3 },
];

export const SOURCES = [
  { label: "Membro (Indicação)", value: 1 },
  { label: "Redes Sociais", value: 2 },
  { label: "Grupo Online", value: 3 },
  { label: "Evento/Campo", value: 4 },
  { label: "Pesquisa Google", value: 5 },
  { label: "Site Oficial", value: 6 },
  { label: "Outro", value: 7 },
];

export const LOADOUT_ITEMS = [
  { key: "helmet", label: "Capacete", optional: false },
  { key: "bonnie_hat", label: "Bonnie Hat", optional: false },
  { key: "ski_mask", label: "Balaclava", optional: false },
  { key: "headset", label: "Headset", optional: false },
  { key: "combat_shirt", label: "Combat Shirt", optional: false },
  { key: "tactical_pants", label: "Calça Tática", optional: false },
  { key: "tactical_vest", label: "Colete Tático", optional: false },
  { key: "tactical_belt", label: "Cinto Tático", optional: false },
  { key: "gloves", label: "Luvas", optional: false },
  { key: "knee_pads", label: "Joelheira", optional: true },
  { key: "combat_boot", label: "Coturno", optional: false },
  { key: "holster", label: "Coldre", optional: false },
  { key: "walkie_talkie", label: "Rádio", optional: false },
];

export const ARSENAL_COLUMNS = [
  { field: "name", header: "Nome" },
  {
    field: "type",
    header: "Tipo",
    isTag: true,
    map: WEAPON_TYPES,
    severity: "contrast",
  },
  {
    field: "category",
    header: "Categoria",
    isTag: true,
    map: CATEGORIES,
    severity: "info",
  },
  { field: "joule", header: "Joule" },
  { field: "fps", header: "FPS" },
  { field: "maintained_at", header: "Última Manutenção", isDate: true },
];

export interface SkillAttribute {
  field: string;
  header: string;
  tag: string;
}

export type SkillStats = Record<string, number>;

export const SKILL_ATTRIBUTES: SkillAttribute[] = [
  { field: "honor", header: "Honra", tag: "HON" },
  { field: "aim", header: "Precisão", tag: "PRE" },
  { field: "tactics", header: "Tática", tag: "TAC" },
  { field: "communication", header: "Comunicação", tag: "COM" },
  { field: "mobility", header: "Mobilidade", tag: "MOB" },
  { field: "stealth", header: "Furtividade", tag: "FUR" },
];


export const RADAR_OPTIONS: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      angleLines: {
        display: true,
        color: "rgba(255, 255, 255, 0.15)",
      },
      grid: {
        color: "rgba(255, 255, 255, 0.15)",
      },
      suggestedMin: 0,
      suggestedMax: 5,
      ticks: {
        stepSize: 1,
        backdropColor: "transparent",
        color: "#9ca3af",
        font: { size: 10 },
      },
      pointLabels: {
        font: { size: 14, weight: "bold", family: "sans-serif" },
        color: "#e5e7eb",
      },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(13, 21, 51, 0.95)",
      titleColor: "#DAA520",
      bodyFont: { size: 14 },
      padding: 12,
      borderColor: "rgba(218, 165, 32, 0.3)",
      borderWidth: 2,
      callbacks: {
        title: (context: TooltipItem<"radar">[]) => {
          const item = context[0];
          if (!item) return "";

          const index = item.dataIndex;

          return SKILL_ATTRIBUTES[index]?.header.toUpperCase() || "";
        },
      },
    },
  },
};

export const getRadarChartData = (stats: SkillStats): ChartData<"radar"> => {
  return {
    labels: SKILL_ATTRIBUTES.map((attr) => attr.tag),
    datasets: [
      {
        label: "Nível",
        data: SKILL_ATTRIBUTES.map((attr) => stats[attr.field] || 0),

        backgroundColor: "rgba(218, 165, 32, 0.3)",
        borderColor: "#DAA520",
        borderWidth: 2,
        pointBackgroundColor: "#DAA520",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#DAA520",
        fill: true,
      },
    ],
  };
};

export const EVENTS_COLUMNS = [
  { field: "title", header: "Titulo" },
  {
    field: "type",
    header: "Tipo",
    isTag: true,
    map: EVENT_TYPES,
    severity: "contrast",
  },
  { field: "date", header: "Data", isDate: true },
  { field: "location_name", header: "Localização" },
  { field: "description", header: "Descrição" },
];

export const RULES = [
  "RESCOM",
  "SAR",
  "MILSIM",
  "RUK",
];

export const TEAMS = [
  "1º BAC",
  "Airsoft Paulo Afonso",
  "ANAT",
  "Arcanjo Porto Seguro",
  "Arcanjos da Chapada",
  "Arcanjos Soldiers",
  "Arkanjos",
  "Black Hawk",
  "Black Lions",
  "Black Ops",
  "Black Skull",
  "Black Weapon",
  "Blackout-SE",
  "Bratva",
  "Bravo",
  "Cães Selvagens Airsoft",
  "Canes",
  "CAPA",
  "Carcará",
  "CAS",
  "Casal Airsoft - Serrinha",
  "CAT",
  "CATA",
  "Catingueiros Airsoft Lençóis",
  "CEDAM",
  "CGAT",
  "Chakal",
  "Chivalry",
  "Cia de Airsoft Delta",
  "CITE",
  "Comando Selva",
  "Corvos de Amargosa",
  "COTA",
  "CPAT",
  "CTA - Petrolina",
  "Cyrus Company",
  "DCC -  Corisco do Cumbe",
  "Delta Force",
  "Desertores",
  "DETA",
  "Dias D'Ávila",
  "Dinops",
  "Dragons Tactical",
  "Drakkar",
  "E.F.A.S.",
  "Equipe Arcanjo",
  "Esquadrão Fantasma",
  "F.E.A.T.",
  "FBI",
  "FEAR",
  "Fênix",
  "Fominhas",
  "Força Tática SSA",
  "Fortes Airsoft",
  "Frontline",
  "G.T.A.A.",
  "Gladiators",
  "GOAJ",
  "Havoc Team Airsoft",
  "IDFA",
  "Independente",
  "Kavock",
  "Kimera Airsoft",
  "Legionários",
  "Linat",
  "Lycans",
  "Mad Max",
  "Mamute",
  "Mercenários Alagoas",
  "Mercenários SSA",
  "Mossad",
  "Navy Seals",
  "Nika",
  "Panthers",
  "Pentágono",
  "Phantom",
  "Pintos de Briga Airsoft",
  "Psycho",
  "Outros",
  "Os Mercenários Team",
  "Outlaws",
  "Rangers",
  "Rangers - RAS",
  "Raptors",
  "RAT",
  "Red Dragon",
  "Renegados",
  "Ronin Tatical",
  "SAT",
  "SCAQ",
  "Seals Team",
  "Shaun Carneiro",
  "Sicário",
  "SKAT",
  "SKULL",
  "Sniper Team",
  "SOHAT",
  "Spartan Salvador",
  "Squad Caveira Esporte",
  "S.C.A.R.",
  "Tarja Preta",
  "Team Assault",
  "Team Six",
  "Terror",
  "Tier One",
  "TNT",
  "Tocaia",
  "TSA - Serrinha",
  "Urubus",
  "Terror - É o Bicho",
  "Ubatã Combat",
  "WR Airsoft 1ª Capital"
];

export const ALLERGIES = [
  "Abacate", "Abacaxi", "Abelha", "Açafrão", "Ácaros da poeira", "Ácaros da Poeira", "Ácido valpróico", "Acrilatos (Dentes/Unhas)", "Adesivos", "Aditivos alimentares", "Água (Aquagênica)", "Aipo", "Aipo (Salsão)", "Alcachofra", "Alcaparras", "Alecrim", "Algas (Nori)", "Algodão", "Alho", "Alpha-gal (Carne vermelha)", "Alternaria", "Amaciante de Roupa", "Amaciantes", "Ambrósia", "Ameixa", "Amêndoa", "Amendoim", "Amido de milho", "Amônia", "Amora", "Amoxicilina", "Ampicilina", "Anestésicos gerais", "Anestésicos Locais (Lidocaína)", "Anti-inflamatórios (Aspirina/Ibuprofeno)", "Anticonvulsivantes", "Aranha", "Arroz", "Aspargos", "Aspartame", "Aspergillus", "Aspirina (AAS)", "Atum", "Aveia", "Avelã", "Azitromicina", "Bacalhau", "Bacitracina", "Bálsamo do Peru", "Banana", "Barata (partículas em suspensão)", "Barata alemã", "Barata americana", "Baratas (Detritos)", "Baunilha", "Benzoato de sódio", "Benzocaína", "Berinjela", "Bicho-da-seda", "Borracha natural", "Cacau", "Caju (Fruta)", "Camarão", "Canela", "Carambola", "Caranguejo", "Carbamazepina", "Carmim (Inseto)", "Carne bovina", "Carne de cordeiro", "Carne de frango", "Carne de Porco", "Carne suína", "Carpa", "Carrapato", "Carvalho", "Caseína", "Castanha", "Castanha-de-caju", "Castanha-do-Pará", "Caviar / Ovas", "Cebola", "Cedro", "Cefalexina", "Ceftriaxona", "Celecoxibe", "Centeio", "Ceras", "Cereja", "Cetoprofeno", "Cevada", "Cevada maltada", "Chocolate", "Chocolate (Cacau ou Leite)", "Ciprofloxacino", "Cladosporium", "Claritromicina", "Clorexidina", "Cloro", "Cloro (Gás)", "Cobalto", "Cobalto (Metais)", "Cobre", "Codeína", "Coentro", "Cogumelo Shimeji", "Cogumelo Shitake", "Colas", "Conservantes (Parabenos)", "Contraste iodado", "Contraste radiológico", "Contrastes de Gadolínio", "Corante Tartrazina", "Corante Tartrazina (Amarelo 5)", "Corante Vermelho 40", "Cravo", "Cromo", "Cromo (Couro/Cimento)", "Damasco", "Dermatophagoides farinae", "Dermatophagoides pteronyssinus", "Detergentes", "Detergentes e Sabão em Pó", "Diclofenaco", "Dióxido de enxofre", "Dipirona", "Edamame", "Enoxaparina", "Epitélio de Cão", "Epitélio de Gato (Saliva/Pelo)", "Eritromicina", "Erva-doce", "Ervilha", "Escargot", "Escorpião", "Esmaltes", "Espelta", "Eucalipto", "Exercício físico (Anafilaxia induzida)", "Fava", "Feijão", "Fenitoína", "Fentanil", "Figo", "Formaldeído", "Formaldeído (Esmaltes)", "Formiga de fogo", "Formiga lava-pés", "Fragrâncias", "Fragrâncias e Perfumes", "Framboesa", "Fruta do conde", "Frutos do Mar (Lagosta/Siri)", "Frutos Secos (Damasco/Passas)", "Fungos", "Gafanhoto", "Gasolina", "Gelatina", "Geléia Real", "Gergelim", "Glutamato monossódico", "Glúten", "Grão-de-bico", "Grapefruit", "Grilo", "Heparina", "Hortelã", "Ibuprofeno", "IECA (Anti-hipertensivos)", "Insulina bovina", "Insulina suína", "Iodo", "Iodo / Contraste Radiológico", "Iodo povidona", "Isocianatos", "Isocianatos (Tintas)", "Kiwi", "Lã", "Lactose", "Lagosta", "Lagostim", "Lamotrigina", "Lanolina", "Laranja", "Látex", "Látex (Preservativos)", "Lecitina de soja", "Leite de vaca", "Lentilha", "Levofloxacino", "Lichia", "Lidocaína", "Limão", "Linguado", "Louro", "Lula", "Lupino", "Luz solar (Fotossensibilidade)", "Maçã", "Macadâmia", "Mamão", "Manga", "Manjericão", "Marimbondo", "Mel de abelha", "Melancia", "Melão", "Mexilhão", "Milho", "Mirtilo (Blueberry)", "Mofo", "Mofos e Fungos", "Moluscos", "Morango", "Morfina", "Mosquito", "Mostarda", "Naproxeno", "Neodímio (Ímãs)", "Neomicina", "Neoprene", "Nimesulida", "Níquel (bijuterias/botões)", "Níquel (Joias/Metais)", "Níquel em iPhones/Relógios", "Nitrato de prata", "Nitrofurantoína", "Noz", "Noz-moscada", "Noz-pecã", "Nozes e Castanhas", "Óleo de amendoim", "Óleo de gergelim", "Orégano", "Ostra", "Ouro", "Ovo (Clara)", "Ovo (Gema)", "Ovo (principalmente a clara)", "Ozônio", "Parabenos", "Paracetamol", "Parafenilenodiamina (PPD)", "Particulados de Diesel", "Pau-brasil (Pó)", "Peixe (Geral)", "Peixes (Bacalhau/Salmão)", "Pelo de cachorro", "Pelo de cavalo", "Pelo de coelho", "Pelo de Coelho", "Pelo de gato", "Pelo de hamster", "Pelo de porquinho-da-índia", "Penas de aves", "Penas de Aves", "Penicilina", "Penicilina (e derivados)", "Penicillium", "Pêra", "Percevejo", "Perfumes", "Pernilongo", "Pêssego", "Picada de Pernilongo", "Pimenta", "Pimentão", "Pinhão", "Pinheiro", "Pistache", "Pitaia (Dragão)", "Pó de camarão", "Pólen (Gramíneas e Flores)", "Pólen de árvores", "Pólen de ervas daninhas", "Pólen de flores", "Pólen de gramíneas", "Pólen-alimento (PFS)", "Polietilenoglicol (PEG)", "Polvo", "Prata", "Pressão na pele", "Prilocaína", "Produtos de limpeza", "Própolis", "Proteína do Leite de Vaca", "Protetor solar (PABA)", "Pulga", "Querosene", "Quimioterápicos", "Quinoa", "Quorn (Micoproteína)", "Rabanete", "Resina epóxi", "Romã", "Sabão em pó", "Sacarina", "Salmão", "Salsa", "Salsão", "Sálvia", "Sardinha", "Semente de abóbora", "Semente de girassol", "Semente de linhaça", "Semente de mostarda", "Semente de papoula", "Silicone de Próteses", "Siri", "Soja", "Solventes", "Soro antiofídico", "Soro de leite", "Sulfa", "Sulfa (Antibióticos)", "Sulfitos", "Sulfonamidas", "Suor (Urticária colinérgica)", "Taturana", "Terebentina", "Tetraciclina", "Tilápia", "Tintas de parede", "Tintura de cabelo", "Tintura de Cabelo (PPD)", "Tofu", "Tomate", "Tomilho", "Tramadol", "Tremoço", "Trigo", "Trigo (Glúten/Proteína)", "Triticale", "Trufas", "Truta", "Umidade", "Urticária ao calor", "Urticária ao frio", "Vacina da gripe (Ovo)", "Vacina Tríplice Viral", "Veneno de Abelha", "Veneno de Formiga", "Vespa", "Vibração", "Vieira", "Vitamina B12", "Zangão",
]

export const MEDICATIONS = [
  "Acarbose", "Acetazolamida", "Acetilcisteína", "Aciclovir", "Ácido Acetilsalicílico (AAS)", "Ácido Alendrônico", "Ácido Fólico", "Ácido Ursodesoxicólico", "Ácido Valproico", "Adrenalina (Epinefrina)", "Albendazol", "Alfenanil", "Alopurinol", "Alprazolam", "Ambroxol", "Amilorida", "Aminofilina", "Amiodarona", "Amitriptilina", "Amoxicilina", "Amoxicilina + Clavulanato", "Anastrozol", "Anlodipino", "Apixabana", "Atenolol", "Atorvastatina", "Atropina", "Azatioprina", "Azitromicina", "Baclofeno", "Benzoato de Benzila", "Betaistina", "Betametasona", "Bezafibrato", "Bicalutamida", "Bisacodila", "Bisoprolol", "Brimonidina", "Bromazepam", "Brometo de Ipratrópio", "Brometo de Tiotrópio", "Bromexina", "Bromoprida", "Budesonida", "Bupropiona", "Buspirona", "Capecitabina", "Captopril", "Carbamazepina", "Carbonato de Cálcio", "Carbonato de Lítio", "Carisoprodol", "Carvedilol", "Cefadroxila", "Cefalexina", "Ceftriaxona", "Celecoxibe", "Cetirizina", "Cetoconazol", "Cetoprofeno", "Ciclobenzaprina", "Ciclosporina", "Cinarizina", "Ciprofloxacino", "Ciproterona", "Citalopram", "Claritromicina", "Clindamicina", "Clobutinol", "Clomipramina", "Clonazepam", "Clopidogrel", "Cloreto de Potássio", "Clortalidona", "Codeína", "Colchicina", "Colestiramina", "Dabigatrana", "Dapagliflozina", "Desloratadina", "Desogestrel", "Desvenlafaxina", "Dexametasona", "Dextrometorfano", "Diazepam", "Diclofenaco Sódico", "Digoxina", "Dimenidrinato (Dramin)", "Diosmina + Hesperidina", "Dipirona Sódica", "Dobutamina", "Dolutegravir", "Domperidona", "Dopamina", "Doxiciclina", "Dropropizina", "Duloxetina", "Efavirenz", "Empagliflozina", "Enalapril", "Enoxaparina Sódica", "Entecavir", "Escitalopram", "Escopolamina (Buscopan)", "Esomeprazol", "Espironolactona", "Estradiol", "Estrogênios Conjugados", "Etinilestradiol + Gestodeno", "Etoricoxibe", "Ezetimiba", "Febuxostate", "Fenitoína", "Fenofibrato", "Fenoximetilpenicilina", "Fexofenadina (Allegra)", "Finasterida", "Fluconazol", "Fluoxetina", "Fluticasona", "Formoterol", "Furosemida", "Gabapentina", "Gentamicina", "Glibenclamida", "Gliclazida", "Glimepirida", "Glucagon", "Guaifenesina", "Haloperidol", "Hidralazina", "Hidroclorotiazida", "Hidrocortisona", "Hidroxicloroquina", "Hidróxido de Alumínio", "Hidróxido de Magnésio", "Hidroxizina", "Ibuprofeno", "Imatinibe", "Imipramina", "Insulina NPH", "Isosorbida", "Ivermectina", "Lactulose", "Lamivudina", "Lamotrigina", "Latanoprosta", "Letrozol", "Levetiracetam", "Levodropropizina", "Levofloxacino", "Levonorgestrel", "Levotiroxina Sódica", "Liraglutida (Saxenda)", "Loperamida", "Loratadina", "Lorazepam", "Losartana Potássica", "Maleato de Dexclorfeniramina", "Meclizina", "Medroxiprogesterona", "Meloxicam", "Mesalazina", "Metformina", "Metildopa", "Metoclopramida", "Metotrexato", "Metronidazol", "Midazolam", "Mirtazapina", "Montelucaste", "Morfina", "Mupirocina", "Nafazolina", "Naproxeno", "Neomicina + Bacitracina", "Nimesulida", "Nistatina", "Nitazoxanida (Annita)", "Nitrofurantoína", "Nitroglicerina", "Norfloxacino", "Nortriptilina", "Olanzapina", "Omeprazol", "Ondansetrona", "Orfenadrina", "Orlistate", "Oseltamivir (Tamiflu)", "Oximetazolina", "Pantoprazol", "Paracetamol", "Paroxetina", "Pentoxifilina", "Permetrina", "Pioglitazona", "Pirantel", "Piroxicam", "Prednisolona", "Prednisona", "Pregabalina", "Probenecida", "Progesterona", "Prometazina (Fenergan)", "Propofol", "Propranolol", "Quetiapina", "Rabeprazol", "Ranitidina", "Ribavirina", "Risperidona", "Ritonavir", "Rivaroxabana", "Rosuvastatina", "Saccharomyces boulardii", "Salbutamol", "Secnidazol", "Semaglutida (Ozempic)", "Sertralina", "Sibutramina", "Sildenafila (Viagra)", "Silimarina", "Simeticona (Luftal)", "Simvastatina", "Sitagliptina", "Sofosbuvir", "Sucralfato", "Sulfametoxazol + Trimetoprima", "Sulfassalazina", "Sulfato Ferroso", "Tadalafila", "Tamoxifeno", "Tansulosina", "Tenofovir", "Teofilina", "Terbinafina", "Teriparatida", "Timolol", "Tinidazol", "Tizanidina", "Topiramato", "Tramadol", "Trazodona", "Valsartana", "Varfarina Sódica", "Venlafaxina", "Vildagliptina", "Vitamina B12", "Vitamina D3 (Colecalciferol)", "Zolpidem"
];

export const TRANSACTION_CATEGORIES = [
  { value: "monthly_fee", label: "Mensalidade", severity: "info" },
  { value: "enrollment", label: "Matrícula", severity: "info" },
  { value: "goal", label: "Metas", severity: "help" },
  { value: "supply", label: "Suprimentos", severity: "help" },
  { value: "equipment", label: "Equipamentos", severity: "help" },
  { value: "others", label: "Outros", severity: "secondary" },
]

export const TRANSACTION_STATUS = [
  { value: "created", label: "Emitido", severity: "secondary" },
  { value: "pending", label: "Pendente", severity: "warn" },
  { value: "overdue", label: "Vencido", severity: "danger" },
  { value: "paid", label: "Pago", severity: "success" },
];

export const CASHFLOW_TYPES = [
  { value: "income", label: "Entrada", severity: "success" },
  { value: "expense", label: "Saída", severity: "danger" },
]

const RANK_ICONS: Record<string, string> = {
  'Iniciado em Campo': 'ri-medal-line',
  'Operador de Linha': 'ri-medal-line',
  'Especialista Urbano': 'ri-medal-line',
  'Batedor de Vanguarda': 'ri-medal-line',
  'Atirador Designado': 'ri-medal-line',
  'Estrategista de Setor': 'ri-medal-line',
  'Lobo da Floresta': 'ri-medal-line',
  'Mestre de Armas': 'ri-medal-line',
  'Veterano de Elite': 'ri-medal-line',
  'Sombra da Unidade': 'ri-medal-line',
  'O Fantasma': 'ri-medal-line',
  'Comandante de Campo': 'ri-medal-line',
  'Operador Black Ops': 'ri-medal-line',
  'Sentinela de Ferro': 'ri-medal-line',
  'Infiltrador Mestre': 'ri-medal-line',
  'Lenda do Asfalto': 'ri-medal-line',
  'General de Divisão': 'ri-medal-line',
  'Águia de Rapina': 'ri-medal-line',
  'Titã da Unidade': 'ri-medal-line',
  'Oráculo de Guerra': 'ri-medal-line',
  'Guardião do Êxodo': 'ri-medal-line',
  'O Mito de Platina': 'ri-medal-line'
};

const SKILL_ICONS: Record<string, string> = {
  'honor': 'ri-honour-line',
  'aim': 'ri-crosshair-2-line',
  'tactics': 'ri-organization-chart',
  'communication': 'ri-speak-line',
  'mobility': 'ri-footprint-line',
  'stealth': 'ri-eye-off-line'
};

export const ALL_BADGES_DEFINITION = [
  ...[1, 2, 3, 4, 5].map(n => ({
    slug: `rating_star_${n}`,
    label: `${n} Estrelas`,
    icon: 'ri-star-fill',
    color: '#fbbf24',
    description: `Graduação oficial de ${n} estrelas no time.`
  })),
  ...LEVELS.map(l => ({
    slug: `rank_${l.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_')}`,
    label: `Patente: ${l.label}`,
    icon: RANK_ICONS[l.label],
    color: '#f59e0b',
    description: l.description
  })),
  ...SKILL_ATTRIBUTES.map(s => ({
    slug: `master_${s.field}`,
    label: `Mestre em ${s.header}`,
    icon: SKILL_ICONS[s.field] || 'ra ra-shield',
    color: '#a78bfa',
    description: `Média de excelência em ${s.header} nos votos do time.`
  })),
  { slug: 'specialty_assault', label: 'Especialista Assault', icon: 'ri-focus-3-line', color: '#f87171', description: 'Operador focado em linha de frente e progressão.' },
  { slug: 'specialty_dmr', label: 'Especialista DMR', icon: 'ri-target-line', color: '#a78bfa', description: 'Precisão e suporte a média distância.' },
  { slug: 'specialty_sniper', label: 'Especialista Sniper', icon: 'ri-crosshair-line', color: '#60a5fa', description: 'Olhos do time e eliminação de alvos críticos.' },
  { slug: 'specialty_support', label: 'Especialista Suporte', icon: 'ri-shield-flash-line', color: '#fbbf24', description: 'Supressão e volume de fogo constante.' },
  { slug: 'arsenal_collector', label: 'Colecionador', icon: 'ri-stack-line', color: '#3b82f6', description: 'Possui um arsenal com 5 ou mais equipamentos.' },
  { slug: 'high_power_unit', label: 'Força de Impacto', icon: 'ri-fire-line', color: '#ef4444', description: 'Equipamento operando acima de 400 FPS.' },
  { slug: 'certified_sniper', label: 'Sniper Certificado', icon: 'ri-crosshair-line', color: '#60a5fa', description: 'Possui armamento de categoria Sniper no arsenal.' },
  { slug: 'verified_arsenal', label: 'Arsenal Legalizado', icon: 'ri-file-list-3-line', color: '#10b981', description: 'Equipamentos com Nota Fiscal anexada ao sistema.' },
  { slug: 'standard_operator', label: 'Operador Padrão', icon: 'ri-shield-user-line', color: '#22c55e', description: 'Possui pelo menos 1 loadout completo e verificado.' },
  { slug: 'tactical_chameleon', label: 'Camaleão Tático', icon: 'ri-palette-line', color: '#10b981', description: 'Possui os 3 loadouts oficiais do time completos.' },
  { slug: 'pmc_expert', label: 'Especialista PMC', icon: 'ri-spy-line', color: '#78350f', description: 'Domina o estilo de operação Private Military Company.' },
  { slug: 'active_standing', label: 'Operador em Dia', icon: 'ri-coins-line', color: '#22c55e', description: 'Sem pendências financeiras com o time.' },
  { slug: 'generous_contributor', label: 'Doador de Metas', icon: 'ri-hand-coin-line', color: '#f472b6', description: 'Contribuiu para metas coletivas do Êxodo Airsoft.' },
  { slug: 'punctual_operator', label: 'Pontualidade Britânica', icon: 'ri-calendar-check-line', color: '#10b981', description: 'Pagamentos realizados sempre dentro do prazo.' },
  { slug: 'blood_donor', label: 'Doador de Sangue', icon: 'ri-drop-line', color: '#ef4444', description: 'Operador que contribui com o banco de sangue local.' },
  { slug: 'health_protected', label: 'Plano Ativo', icon: 'ri-shield-cross-line', color: '#34d399', description: 'Possui plano de saúde informado para emergências.' },
  { slug: 'safety_first', label: 'Segurança em Foco', icon: 'ri-first-aid-kit-line', color: '#10b981', description: 'Informações de alergias e remédios devidamente preenchidas.' },
  { slug: 'emergency_ready', label: 'Contato de Emergência', icon: 'ri-phone-line', color: '#f87171', description: 'Possui contato de emergência configurado no perfil.' },
  { slug: 'social_media_elite', label: 'Elite Digital', icon: 'ri-instagram-line', color: '#e1306c', description: 'Perfil vinculado ao Instagram para promoção do time.' },
  { slug: 'terms_compliant', label: 'Estatuto Aceito', icon: 'ri-file-check-line', color: '#64748b', description: 'Aceitou formalmente os termos e regras do time.' },
  { slug: 'profile_storyteller', label: 'Identidade Tática', icon: 'ri-chat-quote-line', color: '#a78bfa', description: 'Possui uma frase de efeito configurada no perfil.' },
  { slug: 'birthday_warrior', label: 'Aniversariante', icon: 'ri-cake-2-line', color: '#f472b6', description: 'Badge especial ativada no dia do aniversário.' },
  { slug: 'camera_ready', label: 'Fotogênico', icon: 'ri-camera-lens-line', color: '#3b82f6', description: 'Concedeu autorização para uso de imagem em mídias.' },
  { slug: 'prestige_master', label: 'Mestre Prestígio', icon: 'ri-vip-crown-line', color: '#8b5cf6', description: 'Operador que atingiu o primeiro nível de prestígio.' },
  { slug: 'pioneer_member', label: 'Membro Pioneiro', icon: 'ri-flag-2-line', color: '#6366f1', description: 'Membro que faz parte da fundação/início do projeto.' },
  { slug: 'seasoned_veteran', label: 'Veterano Calejado', icon: 'ri-user-star-line', color: '#10b981', description: 'Experiência avançada comprovada em campo.' },
  { slug: 'federated_operator', label: 'Operador Federado', icon: 'ri-government-line', color: '#3b82f6', description: 'Possui registro oficial na FDBA.' },
  { slug: 'mobile_unit', label: 'Unidade Móvel', icon: 'ri-car-line', color: '#64748b', description: 'Operador possui veículo cadastrado para o time.' },
  { slug: 'logistics_specialist', label: 'Especialista em Logística', icon: 'ri-route-line', color: '#f59e0b', description: 'Já ofereceu carona para outros membros em eventos.' },
  { slug: 'hospitality_host', label: 'Anfitrião', icon: 'ri-user-add-line', color: '#22c55e', description: 'Trouxe visitantes e novos recrutas para conhecer o time.' },
  { slug: 'road_captain', label: 'Capitão de Estrada', icon: 'ri-steering-2-line', color: '#f59e0b', description: 'Líder em caronas oferecidas para o time.' },
  { slug: 'team_ambassador', label: 'Embaixador Êxodo', icon: 'ri-user-add-line', color: '#3b82f6', description: 'Responsável por trazer novos visitantes para a Arena.' },
  { slug: 'armorer_apprentice', label: 'Aprendiz de Armeiro', icon: 'ri-tools-line', color: '#94a3b8', description: 'Realizou sua primeira manutenção técnica no sistema.' },
  { slug: 'well_maintained', label: 'Arsenal Impecável', icon: 'ri-shield-star-line', color: '#10b981', description: 'Todos os equipamentos do arsenal estão com a revisão em dia.' },
  { slug: 'iron_operator', label: 'Iron Operator', icon: 'ri-robot-line', color: '#ef4444', description: 'Conquista Lendária: Elite em Rating, Nível e Organização.' },
  { slug: 'weekend_warrior', label: 'Guerreiro de Fim de Semana', icon: 'ri-calendar-event-line', color: '#10b981', description: 'Operador com disponibilidade total para sábados e domingos.' },
  { slug: 'specialized_professional', label: 'Especialista Civil', icon: 'ri-briefcase-line', color: '#6366f1', description: 'Perfil profissional preenchido para networking no time.' },
  { slug: 'blood_type_ready', label: 'Ficha Médica Vital', icon: 'ri-heart-pulse-line', color: '#ef4444', description: 'Tipo sanguíneo e contato de emergência devidamente configurados.' },
  { slug: 'bench_master', label: 'Mestre da Bancada', icon: 'ri-hammer-fill', color: '#f59e0b', description: 'Operador com mais de 10 manutenções concluídas no histórico.' },
  { slug: 'upgrade_expert', label: 'Especialista em Performance', icon: 'ri-rocket-2-line', color: '#8b5cf6', description: 'Realizou manutenções focadas em upgrades e melhoria de desempenho.' },
  { slug: 'detailed_tech', label: 'Técnico Detalhista', icon: 'ri-file-list-2-line', color: '#3b82f6', description: 'Preenche relatórios técnicos detalhados para o histórico do time.' },
  { slug: 'combat_engineer', label: 'Engenheiro de Combate', icon: 'ri-settings-5-line', color: '#ef4444', description: 'Possui um histórico vasto de reparos e revisões complexas.' }
];

export const AVAILABILITY_TYPES = [
  { label: 'Sábado', value: 'saturday' },
  { label: 'Domingo', value: 'sunday' },
  { label: 'Fim de Semana', value: 'both' },
]

export const PROFESSION_TYPES = [
  "Médico", "Advogado", "Engenheiro Civil", "Professor", "Arquiteto",
  "Contador", "Psicólogo", "Enfermeiro", "Dentista", "Veterinário",
  "Fisioterapeuta", "Nutricionista", "Farmacêutico", "Biólogo", "Geólogo",
  "Astrônomo", "Físico", "Químico", "Matemático", "Estatístico",
  "Arqueólogo", "Antropólogo", "Sociólogo", "Filósofo", "Historiador",
  "Geógrafo", "Jornalista", "Publicitário", "Designer Gráfico", "Ilustrador",
  "Fotógrafo", "Cinegrafista", "Editor de Vídeo", "Ator", "Dançarino",
  "Músico", "Maestro", "Escultor", "Pintor Artístico", "Escritor",
  "Tradutor", "Intérprete", "Bibliotecário", "Museólogo", "Arquivista",
  "Administrador", "Economista", "Corretor de Imóveis", "Corretor de Seguros", "Gerente de Vendas",
  "Vendedor", "Recepcionista", "Secretária", "Auxiliar Administrativo", "Porteiro",
  "Zelador", "Faxineiro", "Jardineiro", "Paisagista", "Agrônomo",
  "Zootecnista", "Pescador", "Agricultor", "Marceneiro", "Carpinteiro",
  "Pedreiro", "Mestre de Obras", "Eletricista", "Encanador", "Pintor Predial",
  "Gesseiro", "Serralheiro", "Soldador", "Mecânico", "Funileiro",
  "Estofador", "Alfaiate", "Costureira", "Modelo", "Cabeleireiro",
  "Barbeiro", "Manicure", "Esteticista", "Maquiador", "Tatuador",
  "Piercer", "Garçom", "Bartender", "Sommelier", "Barista",
  "Confeiteiro", "Açougueiro", "Peixeiro", "Cozinheiro", "Comissário de Bordo",
  "Guia de Turismo", "Agente de Viagens", "Piloto de Avião", "Motorista de Caminhão", "Motorista de Ônibus",
  "Maquinista", "Capitão de Navio", "Mergulhador", "Salva-vidas", "Bombeiro",
  "Policial", "Delegado", "Juiz", "Promotor", "Diplomata",
  "Político", "Guarda Municipal", "Vigilante", "Detetive", "Perito Criminal",
  "Paramédico", "Instrumentador Cirúrgico", "Radiologista", "Topógrafo", "Programador",
  "Analista de Sistemas", "Web Designer", "Social Media", "Gestor de Tráfego", "Copywriter",
  "Revisor", "Dublador", "Locutor", "Sonoplasta", "Iluminador",
  "Cenógrafo", "Figurinista", "Curador de Arte", "Joalheiro", "Relojoeiro",
  "Sapateiro", "Chaveiro", "Vidraceiro", "Marmorista", "Azulejista",
  "Engenheiro Químico", "Engenheiro Elétrico", "Engenheiro Mecânico", "Engenheiro de Produção", "Engenheiro Ambiental",
  "Engenheiro de Alimentos", "Engenheiro de Minas", "Engenheiro Naval", "Engenheiro Aeroespacial", "Engenheiro Biomédico",
  "Atleta", "Treinador", "Árbitro", "Preparador Físico", "Personal Trainer",
  "Instrutor de Yoga", "Piloto de Corrida", "Coreógrafo", "Malabarista", "Mágico",
  "Humorista", "Roteirista", "Produtor", "Diretor de Cinema", "Crítico",
  "Coach", "Consultor de RH", "Headhunter", "Auditor", "Despachante",
  "Agente Funerário", "Embalsamador", "Florista", "Adestrador", "Tosador",
  "Biotecnólogo", "Ecólogo", "Meteorologista", "Oceanógrafo", "Paleontólogo",
  "Cartógrafo", "Urbanista", "Decorador", "Organizador de Eventos", "Cerimonialista",
  "Relações Públicas", "Captador de Recursos", "Analista de Investimentos", "Trader", "Minerador",
  "Ourives", "Alfarrabista", "Calígrafo", "Cartunista", "Cenotécnico",
  "Cobrador", "Desenhista Industrial", "Ebanista", "Enólogo", "Paleógrafo"
];

export const MAINTENANCE_TYPES = [
  { label: 'Revisão', value: 'revison' },
  { label: 'Reparo', value: 'repair' },
  { label: 'Upgrade', value: 'upgrade' },
]

export const MAINTENANCE_STATUS_TYPES = [
  { label: 'Aguardando Peças', value: 'waiting' },
  { label: 'Concluído', value: 'completed' },
  { label: 'Na Bancada', value: 'bench' },
]

export const SCHEDULE_TYPES = {
  training: { label: 'Treino de Arena', severity: 'danger' },
  maintenance: { label: 'Manutenção de Arena', severity: 'warn' }
};

export const SCHEDULE_STATUS = {
  scheduled: { label: 'Agendado', severity: 'secondary' },
  completed: { label: 'Concluído', severity: 'success' },
  canceled: { label: 'Cancelado', severity: 'danger' }
};