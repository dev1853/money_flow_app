// frontend/src/pages/CounterpartiesPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react'; 
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

// Компоненты
import Modal from '../components/Modal';
import CounterpartyForm from '../components/forms/CounterpartyForm'; 
import ConfirmationModal from '../components/ConfirmationModal';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import UniversalTable from '../components/UniversalTable';
import Alert from '../components/Alert';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import CounterpartyCard from '../components/CounterpartyCard'; // Для режима сетки
import { CounterpartyType } from '../utils/constants';
import { PlusIcon, PencilSquareIcon, TrashIcon, RectangleGroupIcon, TableCellsIcon } from '@heroicons/react/24/solid'; 
import { useApiMutation } from '../hooks/useApiMutation'; 
import { useDataFetching } from '../hooks/useDataFetching'; 

function CounterpartiesPage() {
  const { activeWorkspace, isLoading: authLoading } = useAuth(); 
  
  const [counterparties, setCounterparties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [counterpartyToEdit, setCounterpartyToEdit] = useState(null);
  const [counterpartyToDelete, setCounterpartyToDelete] = useState(null);

  const [viewMode, setViewMode] = useState('table'); 
  const [filterType, setFilterType] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

  const fetchCounterparties = useCallback(async () => {
    if (!activeWorkspace?.id) return { items: [], total: 0 };
    const params = { workspace_id: activeWorkspace.id };
    if (filterType !== 'all') {
      params.type = filterType;
    }
    if (filterSearch) {
      params.search = filterSearch;
    }
    const result = await apiService.getCounterparties(params); // ИСПРАВЛЕНО: apiService.getCounterparties возвращает пагинированный объект
    console.log("CounterpartiesPage: Данные из API для контрагентов:", result); // Для отладки
    return result;
  }, [activeWorkspace, filterType, filterSearch]);

  const { data: counterpartyData, loading: isLoadingCounterparties, error: counterpartyError, refetch: refetchCounterparties } = useDataFetching(
    fetchCounterparties,
    [fetchCounterparties, activeWorkspace],
    { skip: !activeWorkspace }
  );

  useEffect(() => {
    setCounterparties(counterpartyData?.items || []); // ИСПРАВЛЕНО: Извлекаем items
    setLoading(isLoadingCounterparties || authLoading);
    if (counterpartyError) setError(counterpartyError.message);
  }, [counterpartyData, isLoadingCounterparties, authLoading, counterpartyError]);

  const [createUpdateCounterparty, { isLoading: isMutating, error: mutationError }] = useApiMutation(
    async (cpData) => {
      if (counterpartyToEdit) {
        return await apiService.updateCounterparty(counterpartyToEdit.id, cpData);
      } else {
        return await apiService.createCounterparty(cpData);
      }
    },
    {
      onSuccess: () => {
        handleCloseModal();
        refetchCounterparties();
      },
      onError: (err) => {
        setError(err.message || 'Ошибка при сохранении контрагента.');
      }
    }
  );

  const [deleteCounterpartyMutation, { isLoading: isDeleting, error: deleteError }] = useApiMutation(
    async (id) => {
      return await apiService.deleteCounterparty(id);
    },
    {
      onSuccess: () => {
        setCounterpartyToDelete(null);
        refetchCounterparties();
      },
      onError: (err) => {
        setError(err.message || 'Ошибка при удалении контрагента.');
      }
    }
  );

  const handleOpenCreateModal = () => {
    setCounterpartyToEdit(null);
    setIsModalOpen(true);
    setError('');
  };

  const handleOpenEditModal = (counterparty) => {
    setCounterpartyToEdit(counterparty);
    setIsModalOpen(true);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCounterpartyToEdit(null);
    setError('');
  };

  const handleDeleteRequest = (counterparty) => {
    setCounterpartyToDelete(counterparty);
    setError('');
  };

  const handleDeleteConfirm = async () => {
    if (counterpartyToDelete) {
      await deleteCounterpartyMutation(counterpartyToDelete.id);
    }
  };

  const getCounterpartyTypeLabel = (type) => {
    return {
      [CounterpartyType.CLIENT]: "Клиент",
      [CounterpartyType.SUPPLIER]: "Поставщик",
      [CounterpartyType.EMPLOYEE]: "Сотрудник",
      [CounterpartyType.OTHER]: "Прочее",
    }[type] || type;
  };

  const columns = useMemo(() => [
      { key: 'name', label: 'Название', className: 'flex-grow', accessor: 'name' },
      { 
          key: 'type', 
          label: 'Тип', 
          className: 'w-32', 
          render: (row) => getCounterpartyTypeLabel(row.type) 
      },
      { 
          key: 'contacts', 
          label: 'Контакты', 
          className: 'w-48', 
          render: (row) => (
            <>
              {row.email && <p>{row.email}</p>}
              {row.phone && <p>{row.phone}</p>}
            </>
          )
      },
      { 
          key: 'actions', 
          label: 'Действия', 
          className: 'w-28 text-center',
          render: (row) => (
              <div className="flex justify-end space-x-2">
                <Button variant="icon" onClick={() => handleOpenEditModal(row)} title="Редактировать"><PencilSquareIcon className="h-5 w-5"/></Button>
                <Button variant="icon" onClick={() => handleDeleteRequest(row)} className="text-red-600 hover:text-red-800" title="Удалить"><TrashIcon className="h-5 w-5"/></Button>
              </div>
          )
      }
  ], [handleOpenEditModal, handleDeleteRequest]); 

  const tableData = useMemo(() => {
    return (counterparties || []).map(item => ({
        ...item,
        // 'type', 'contacts', 'actions' уже обрабатываются в render функциях columns
    }));
  }, [counterparties]);

  const typeOptions = useMemo(() => {
    const options = Object.values(CounterpartyType).map(type => ({
      value: type,
      label: getCounterpartyTypeLabel(type),
    }));
    return [{ value: 'all', label: 'Все типы' }, ...options];
  }, []);

  const renderContent = () => {
    if (loading || isMutating || isDeleting) return <Loader text="Загрузка контрагентов..." />;
    if (error || mutationError || deleteError) return <Alert type="error">{error || mutationError?.message || deleteError?.message}</Alert>;

    if (!counterpartyData || counterpartyData.total === 0) {
      return (
        <EmptyState 
          message="У вас еще нет ни одного контрагента."
          buttonText="Создать первого контрагента"
          onButtonClick={handleOpenCreateModal}
        />
      );
    }

    if (viewMode === 'table') {
      return (
        <UniversalTable 
          columns={columns} 
          data={tableData} 
          loading={loading} 
          emptyMessage="Нет контрагентов по выбранным фильтрам."
        />
      );
    } else { // viewMode === 'grid'
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counterparties.map(counterparty => (
            <CounterpartyCard 
              key={counterparty.id} 
              counterparty={counterparty} 
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <PageTitle title="Контрагенты" />
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

      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Поиск по названию"
            name="search"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          <Select
            label="Тип контрагента"
            name="type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={typeOptions}
          />
        </div>
      </div>
      
      {renderContent()}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={counterpartyToEdit ? 'Редактировать контрагента' : 'Новый контрагент'}
      >
        <CounterpartyForm 
          counterparty={counterpartyToEdit} 
          onSubmit={createUpdateCounterparty} // ИСПРАВЛЕНО: Передаем onSubmit
          onCancel={handleCloseModal} // Добавлен onCancel
          isSubmitting={isMutating} // Передаем состояние загрузки
          error={mutationError} // Передаем ошибку
        />
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(counterpartyToDelete)}
        onClose={() => { setCounterpartyToDelete(null); setError(''); }}
        onConfirm={handleDeleteConfirm}
        title="Удалить контрагента" 
        message={`Вы уверены, что хотите удалить контрагента "${counterpartyToDelete?.name}"? 
          Это действие необратимо и все связанные с ним данные (включая договоры и транзакции) будут потеряны.`}
        errorAlertMessage={error || deleteError?.message} 
      />
    </div>
  );
}

export default CounterpartiesPage;