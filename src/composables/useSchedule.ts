import { ref } from 'vue';
import { useToast } from "primevue/usetoast";
import dayjs from "dayjs";
import { ScheduleService, type ISchedule } from "@/services/schedule";
import { useOperator } from "./useOperator";
import { OperatorService, type IOperator } from "@/services/operator";
import { useConfirm } from 'primevue';

const schedules = ref<ISchedule<IOperator>[]>([]);
const operators = ref<IOperator[]>([]);
const leaders = ref<IOperator[]>([]);

const selectedSchedule = ref<ISchedule>({} as ISchedule);

const scheduleDialog = ref(false);
const loading = ref(false);

const minDate = ref(new Date());

export function useSchedule() {
  const toast = useToast();
  const confirm = useConfirm();
  const { operator } = useOperator();

  const getFinalizeStatus = (schedule: ISchedule<IOperator>) => {
    const now = dayjs();
    const scheduleDate = dayjs(schedule.date);
    const isLeader = schedule.leader?.$id === operator.value?.$id;
    const isPending = schedule.status === 'scheduled';

    const visible = isLeader && isPending;
    const disabled = now.isBefore(scheduleDate, 'day');

    return { visible, disabled };
  };

  const newSchedule = () => {
    selectedSchedule.value = {
      status: "scheduled",
    } as ISchedule
    scheduleDialog.value = true;
  };

  const editSchedule = (schedule: ISchedule<IOperator>) => {
    const operatorIds = schedule.operators.map(op => op.$id);

    setLeadersOptions(operatorIds);

    selectedSchedule.value = {
      ...schedule,
      operators: operatorIds,
      leader: schedule.leader?.$id,
      date: schedule.date ? dayjs(schedule.date).format("DD/MM/YYYY") : null,
      selected: schedule.operators,
    };

    scheduleDialog.value = true;
  };

  const saveSchedule = async (values: ISchedule) => {
    try {
      const response = await ScheduleService.upsert(selectedSchedule.value.$id, values) as ISchedule<IOperator>;

      schedules.value = schedules.value.map(item =>
        item.$id === response.$id ? response : item
      );

      toast.add({ severity: "success", summary: "Sucesso!", detail: "Cronograma salvo.", life: 3000 });
      scheduleDialog.value = false;
    } catch (error) {
      toast.add({ severity: "error", summary: "Erro", detail: "Falha ao salvar.", life: 3000 });
    }
  };

  const confirmDelete = (schedule: ISchedule) => {
    confirm.require({
      message: 'Deseja excluir este cronograma?',
      header: "Confirmação",
      rejectProps: {
        label: 'Não',
        severity: 'secondary',
        outlined: true
      },
      acceptProps: {
        label: 'Sim',
        severity: 'danger'
      },
      accept: async () => {
        await ScheduleService.delete(schedule.$id);
        schedules.value = schedules.value.filter(item => item.$id !== schedule.$id);
        toast.add({ severity: "success", summary: "Excluído", detail: "Cronograma removido.", life: 3000 });
      }
    });
  };

  const finalizeSchedule = async (values: ISchedule) => {
    try {
      const response = await ScheduleService.finalize(selectedSchedule.value.$id, values) as ISchedule<IOperator>;

      schedules.value = schedules.value.map(item =>
        item.$id === response.$id ? response : item
      );

      toast.add({
        severity: "success",
        summary: "Missão Finalizada",
        detail: "Relatório registrado com sucesso!",
        life: 3000,
      });

      scheduleDialog.value = false;
    } catch (error: any) {
      console.error("Erro ao finalizar:", error);
      toast.add({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao finalizar o cronograma.",
        life: 3000
      });
    } finally {
      loading.value = false;
    }
  };

  const loadSchedules = async (fetchOperators = false) => {
    loading.value = true;

    try {
      const promises: Promise<any>[] = [ScheduleService.list()];

      if (fetchOperators && operators.value.length === 0) {
        promises.push(OperatorService.listActive());
      }

      const [scheduleData, operatorData] = await Promise.all(promises);

      schedules.value = scheduleData;

      if (fetchOperators && operatorData) {
        operators.value = operatorData;
      }

      if (schedules.value.length > 0) {
        const timestamps = schedules.value.map(s => dayjs(s.date).valueOf());
        const minTimestamp = Math.min(...timestamps);
        minDate.value = dayjs(minTimestamp).startOf('month').toDate();
      }

    } catch (error) {
      console.error("Erro no loadSchedules:", error);
    } finally {
      loading.value = false;
    }
  };

  const setLeadersOptions = (selectedOperatorIds: string[]) => {
    leaders.value = operators.value.filter(op => selectedOperatorIds.includes(op.$id));
  };

  const schedulesOperator = computed(() => schedules.value.filter(s => s.operators?.some(op => op.$id === operator.value?.$id)))

  return {
    schedules,
    schedulesOperator,
    minDate,
    operators,
    leaders,
    selectedSchedule,
    scheduleDialog,
    loading,
    getFinalizeStatus,
    editSchedule,
    newSchedule,
    saveSchedule,
    confirmDelete,
    finalizeSchedule,
    loadSchedules,
    setLeadersOptions
  };
}