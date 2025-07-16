// frontend/src/pages/ContractsPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Добавлен useMemo
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { formatDate } from '../utils/formatting'; // Используем форматирование даты
import { formatCurrency } from '../utils/formatting'; 

// Компоненты
import Modal from '../components/Modal';
import ContractForm from '../components/forms/ContractForm'; 
import ConfirmationModal from '../components/ConfirmationModal'; 
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import UniversalTable from '../components/UniversalTable';
import Alert from '../components/Alert'; 
import { ContractStatus } from '../utils/constants'; 
// ИСПРАВЛЕНО: Импортируем PencilSquareIcon и TrashIcon (solid)
import { PlusIcon, PencilSquareIcon, TrashIcon, RectangleGroupIcon, TableCellsIcon } from '@heroicons/react/24/solid'; 
import { useApiMutation } from '../hooks/useApiMutation'; // Импорт хука для мутаций
import { useDataFetching } from '../hooks/useDataFetching'; // Импорт хука для получения данных

function ContractsPage() {
  const { activeWorkspace, isLoading: authLoading } = useAuth(); 
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState(null);
  const [contractToDelete, setContractToDelete] = useState(null);

  const [viewMode, setViewMode] = useState('table'); 

  // Функция для загрузки данных
  const fetchContracts = useCallback(async () => {
    if (!activeWorkspace?.id) return { items: [], total: 0 };
    const result = await apiService.getContracts({ workspace_id: activeWorkspace.id });
    console.log("ContractsPage: Данные из API для договоров:", result); // <-- ДОБАВЛЕН ЛОГ
    return result;
  }, [activeWorkspace]);

  const { data: contractsData, loading: isLoadingContracts, error: contractsError, refetch: refetchContracts } = useDataFetching(
    fetchContracts,
    [fetchContracts, activeWorkspace],
    { skip: !activeWorkspace }
  );

  useEffect(() => {
    setContracts(contractsData?.items || []);
    setLoading(isLoadingContracts || authLoading);
    if (contractsError) setError(contractsError.message);
  }, [contractsData, isLoadingContracts, authLoading, contractsError]);

  const [createUpdateContract, { isLoading: isMutating, error: mutationError }] = useApiMutation(
    async (contractData) => {
      if (contractToEdit) {
        return await apiService.updateContract(contractToEdit.id, contractData, { workspace_id: activeWorkspace?.id });
      } else {
        return await apiService.createContract(contractData, { workspace_id: activeWorkspace?.id });
      }
    },
    {
      onSuccess: () => {
        handleCloseModal();
        refetchContracts();
      },
      onError: (err) => {
        setError(err.message || 'Ошибка при сохранении договора.');
      }
    }
  );

  const [deleteContractMutation, { isLoading: isDeleting, error: deleteError }] = useApiMutation(
    async (id) => {
      return await apiService.deleteContract(id, { workspace_id: activeWorkspace?.id });
    },
    {
      onSuccess: () => {
        setContractToDelete(null);
        refetchContracts();
      },
      onError: (err) => {
        setError(err.message || 'Ошибка при удалении договора.');
      }
    }
  );

  const handleOpenCreateModal = () => {
    setContractToEdit(null);
    setIsModalOpen(true);
    setError(''); // Очищаем ошибки при открытии модального окна
  };

  const handleOpenEditModal = (contract) => {
    setContractToEdit(contract);
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setContractToEdit(null);
    setError('');
  };

  const handleDeleteRequest = (contract) => {
    setContractToDelete(contract);
    setError('');
  };

  const handleDeleteConfirm = async () => {
    if (contractToDelete) {
      await deleteContractMutation(contractToDelete.id);
    }
  };

  const getStatusLabel = (status) => {
    return {
      [ContractStatus.ACTIVE]: "Активен",
      [ContractStatus.COMPLETED]: "Завершен",
      [ContractStatus.ARCHIVED]: "Архив",
      [ContractStatus.PENDING]: "Ожидает",
    }[status] || status;
  };

  // ИСПРАВЛЕНО: Добавлены accessor или render для каждого столбца в UniversalTable
  const columns = useMemo(() => [
      { 
          key: 'status', 
          label: 'Статус', // Добавлено название для колонки статуса
          className: 'w-16 text-center', 
          render: (row) => {
            const statusLabel = getStatusLabel(row.status);
            let statusClasses = '';
            switch (row.status) {
                case ContractStatus.ACTIVE: statusClasses = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'; break;
                case ContractStatus.COMPLETED: statusClasses = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'; break;
                case ContractStatus.ARCHIVED: statusClasses = 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'; break;
                case ContractStatus.PENDING: statusClasses = 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'; break;
                default: statusClasses = 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200';
            }
            return (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses}`}>
                    {statusLabel}
                </span>
            );
          }
      },
      { key: 'name', label: 'Название', className: 'w-48', accessor: 'name' },
      { key: 'value', label: 'Сумма', className: 'w-28 text-right', render: (row) => formatCurrency(row.value, row.currency) },
      { key: 'start_date', label: 'Начало', className: 'w-24', render: (row) => formatDate(row.start_date) },
      { key: 'end_date', label: 'Окончание', className: 'w-24', render: (row) => formatDate(row.end_date) },
      { key: 'counterparty_name', label: 'Контрагент', className: 'flex-grow', accessor: 'counterparty.name' }, // Предполагаем, что counterparty.name доступен
      { 
          key: 'actions', 
          label: 'Действия', 
          className: 'w-28 text-center',
          render: (row) => (
              <div className="flex justify-end space-x-2">
                {/* ИСПРАВЛЕНО: Кнопки действий унифицированы */}
                <Button variant="icon" onClick={() => handleOpenEditModal(row)} title="Редактировать"><PencilSquareIcon className="h-5 w-5"/></Button>
                <Button variant="icon" onClick={() => handleDeleteRequest(row)} className="text-red-600 hover:text-red-800" title="Удалить"><TrashIcon className="h-5 w-5"/></Button>
              </div>
          )
      }
  ], []);

  const tableData = useMemo(() => {
    return (contracts || []).map(item => ({
        ...item,
        // Если counterparty_name не приходит, подставьте его здесь
        counterparty_name: item.counterparty?.name || 'Без контрагента',
        // 'status', 'amount', 'start_date', 'end_date', 'actions' уже обрабатываются в render функциях columns
    }));
  }, [contracts]);

  const renderContent = () => {
    if (loading) return <Loader text="Загрузка договоров..." />;
    if (error) return <Alert type="error">{error}</Alert>;
    
    if (!contractsData || contractsData.total === 0) { 
      return (
        <EmptyState 
          message="У вас еще нет ни одного договора."
          buttonText="Создать первый договор"
          onButtonClick={handleOpenCreateModal}
        />
      );
    }

    if (viewMode === 'table') {
      // ИСПРАВЛЕНО: Добавлены отладочные логи
      console.log("ContractsPage: Рендеринг UniversalTable. Columns:", columns);
      console.log("ContractsPage: Рендеринг UniversalTable. Data:", tableData);
      return (
        <UniversalTable 
          columns={columns} 
          data={tableData} 
          loading={loading} 
          emptyMessage="Нет договоров по выбранным фильтрам."
        />
      );
    }
    // Отображение в режиме сетки (карточек)
    else { // viewMode === 'grid'
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map(contract => (
            <div key={contract.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold dark:text-gray-100">{contract.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(contract.amount, contract.currency)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Начало: {formatDate(contract.start_date)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Окончание: {formatDate(contract.end_date)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Статус: {getStatusLabel(contract.status)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Контрагент: {contract.counterparty?.name || 'Без контрагента'}</p>
              <div className="flex space-x-2 mt-4">
                {/* ИСПРАВЛЕНО: Кнопки действий унифицированы в Grid View */}
                <Button variant="icon" onClick={() => handleOpenEditModal(contract)} title="Редактировать"><PencilSquareIcon className="h-5 w-5"/></Button>
                <Button variant="icon" onClick={() => handleDeleteRequest(contract)} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400" title="Удалить"><TrashIcon className="h-5 w-5"/></Button>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="dark:text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <PageTitle title="Договоры" />
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'table' ? 'primary' : 'secondary'} 
            onClick={() => setViewMode('table')}
            title="Табличный вид"
          >
            <TableCellsIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'primary' : 'secondary'} 
            onClick={() => setViewMode('grid')}
            title="Вид карточек"
          >
            <RectangleGroupIcon className="h-5 w-5" />
          </Button>
          <Button onClick={handleOpenCreateModal} className="bg-lime-600 hover:bg-lime-700 text-white">
            <PlusIcon className="h-5 w-5 mr-2" />
            Добавить
          </Button>
        </div>
      </div>
      
      {renderContent()}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={contractToEdit ? 'Редактировать договор' : 'Новый договор'}
      >
        <ContractForm 
          contract={contractToEdit}
          onSubmit={createUpdateContract}
          onCancel={handleCloseModal}
          isSubmitting={isMutating}
          error={mutationError}
        />
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(contractToDelete)}
        onClose={() => { setContractToDelete(null); setError(''); }}
        onConfirm={handleDeleteConfirm}
        title="Удалить договор" 
        message={`Вы уверены, что хотите удалить договор "${contractToDelete?.name}"? 
          Это действие необратимо и все связанные с ним данные будут потеряны.`}
        errorAlertMessage={error} 
      />
    </div>
  );
}

export default ContractsPage;