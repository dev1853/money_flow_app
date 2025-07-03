// frontend/src/components/StatementUploadModal.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Modal from './Modal';
import Button from './Button';
import Alert from './Alert';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useDataFetching } from '../hooks/useDataFetching';
import Select from './forms/Select'; 
import Label from './forms/Label'; 

const StatementUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { activeWorkspace } = useAuth();
  
  // Состояния для UI и процесса загрузки файла
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(''); 
  const fileInputRef = useRef(null);

  // Используем наш хук для загрузки ВСЕХ счетов, когда модальное окно открывается
  const { data: allAccounts, error: accountsError } = useDataFetching(
    useCallback(() => {
      if (!activeWorkspace?.id) return Promise.resolve([]);
      return apiService.getAccounts(activeWorkspace.id);
    }, [activeWorkspace?.id]),
    [activeWorkspace?.id],
    { skip: !isOpen } // Оптимизация: не грузить, пока окно закрыто
  );

  // Фильтруем только банковские счета с помощью useMemo
  const bankAccounts = useMemo(() => {
    if (!allAccounts) return [];
    return allAccounts.filter(acc => acc.account_type === 'bank_account');
  }, [allAccounts]);

  // Устанавливаем счет по умолчанию, когда список банковских счетов загружен или изменился
  useEffect(() => {
    // Устанавливаем первый счет в списке, если никакой не выбран или выбранный исчез
    if (bankAccounts.length > 0) {
        const isSelectedAccountValid = bankAccounts.some(acc => acc.id.toString() === selectedAccountId);
        if (!isSelectedAccountValid) {
            setSelectedAccountId(bankAccounts[0].id.toString());
        }
    }
  }, [bankAccounts, selectedAccountId]);

  // Сброс состояния при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setUploadResult(null);
      setError('');
      setUploadLoading(false);
      // Сбрасываем и выбранный счет, чтобы при следующем открытии он установился заново
      setSelectedAccountId(''); 
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadResult(null); 
    setError('');
  };

  const handleUpload = async () => {
        if (!selectedFile || !selectedAccountId) {
            console.error('2. [handleUpload] ПРОВЕРКА НЕ ПРОЙДЕНА. Отсутствует файл или счет.');
            setError('Пожалуйста, formData  и файл, и счет.');
            return;
        }
        
        console.log('3. [handleUpload] Проверки пройдены. Устанавливаю loading = true.');
        setUploadLoading(true);
        setError('');
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('account_id', selectedAccountId);
        const uploadUrl = `/statement/upload`;

        try {
            // Вызываем наш новый, специальный метод для загрузки файлов
            const result = await apiService.uploadStatement(formData);
            setUploadResult(result);
            if (onSuccess) {
              onSuccess(); 
            }
        } catch (err) {
            console.error('6. [handleUpload] ОШИБКА. Перехвачена ошибка:', err);
            setError(err.message || 'Ошибка загрузки файла.');
        } finally {
            console.log('7. [handleUpload] Блок finally. Устанавливаю loading = false.');
            setUploadLoading(false);
        }
    };

  // Объединяем ошибку загрузки счетов и ошибку загрузки файла
  const displayError = error || accountsError;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Загрузить банковскую выписку">
      <div className="space-y-4">
        {displayError && <Alert type="error">{displayError}</Alert>}
        {uploadResult && (
          <Alert type="success">
            Файл успешно загружен. Создано транзакций: {uploadResult.created_transactions_auto} / Пропущено дубликатов: {uploadResult.skipped_duplicates_count} / Ошибок: {uploadResult.failed_rows}
            {uploadResult.failed_row_details && uploadResult.failed_row_details.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-semibold">Подробнее об ошибках:</p>
                <ul className="list-disc pl-5 mt-1 max-h-32 overflow-y-auto">
                  {uploadResult.failed_row_details.map((detail, index) => (
                    <li key={index} className="mt-1">
                      <span className="font-medium">{detail.error}</span> (Строка: {JSON.stringify(detail.row)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Alert>
        )}
        
        <div>
            <Label htmlFor="account_for_statement">Счет для выписки</Label>
            <Select
                id="account_for_statement"
                name="account_id"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                required
                className="w-full"
                disabled={bankAccounts.length === 0}
            >
                <option value="" disabled>
                  {allAccounts ? "Выберите банковский счет" : "Загрузка счетов..."}
                </option>
                {bankAccounts.map(option => (
                    <option key={option.id} value={option.id.toString()}>{option.name} ({option.currency})</option>
                ))}
            </Select>
            {!accountsError && bankAccounts.length === 0 && allAccounts && (
              <p className="text-xs text-red-500 mt-1">Не найдено ни одного банковского счета. Пожалуйста, создайте его на странице "Счета".</p>
            )}
        </div>

        <div>
          <Label htmlFor="file_upload">Выберите файл выписки (.csv, .xlsx)</Label> 
          <input 
            type="file" 
            id="file_upload" 
            ref={fileInputRef} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            onChange={handleFileChange} 
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
          /> 
          {selectedFile && <p className="mt-2 text-sm text-gray-500">Выбран файл: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="secondary" className="mr-2">Отмена</Button>
          <Button onClick={handleUpload} disabled={uploadLoading || !selectedFile || !selectedAccountId}>
            {uploadLoading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StatementUploadModal;