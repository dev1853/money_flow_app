// frontend/src/components/StatementUploadModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import Alert from './Alert';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import Select from './forms/Select'; 
import Label from './forms/Label'; 

const StatementUploadModal = ({ isOpen, onClose, onSuccess }) => {
  console.log("DEBUG(StatementUploadModal): Component Rendered. isOpen:", isOpen); // <--- ЛОГ РЕНДЕРА
  const { activeWorkspace } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  const [accounts, setAccounts] = useState([]); 
  const [selectedAccountId, setSelectedAccountId] = useState(''); 

  const fileInputRef = useRef(null); 


  useEffect(() => {
    console.log("DEBUG(StatementUploadModal): useEffect for accounts mounted/updated. isOpen:", isOpen, "activeWorkspace:", activeWorkspace); // <--- ЛОГ useEffect
    const fetchAccounts = async () => {
      console.log("DEBUG(StatementUploadModal): fetchAccounts called."); // <--- ЛОГ
      if (!activeWorkspace || !activeWorkspace.id) {
        console.warn("DEBUG(StatementUploadModal): No activeWorkspace to fetch accounts."); // <--- ЛОГ
        return;
      }
      try {
        console.log(`DEBUG(StatementUploadModal): Fetching accounts for workspace: ${activeWorkspace.id}`); // <--- ЛОГ
        const fetchedAccounts = await apiService.get(`/accounts/?workspace_id=${activeWorkspace.id}`);
        
        console.log("DEBUG(StatementUploadModal): Fetched accounts raw:", fetchedAccounts); // <--- ЛОГ
        const bankAccounts = fetchedAccounts.filter(acc => acc.account_type === 'bank_account');
        setAccounts(bankAccounts || []);
        console.log("DEBUG(StatementUploadModal): Filtered bank accounts:", bankAccounts); // <--- ЛОГ
        
        if (selectedAccountId && bankAccounts.some(acc => acc.id === parseInt(selectedAccountId))) {
            console.log("DEBUG(StatementUploadModal): Retaining selected account:", selectedAccountId); // <--- ЛОГ
        } else if (bankAccounts.length > 0) {
            setSelectedAccountId(bankAccounts[0].id.toString());
            console.log("DEBUG(StatementModal): Setting default account to first bank account:", bankAccounts[0].id); // <--- ЛОГ
        } else {
            setSelectedAccountId('');
            console.log("DEBUG(StatementModal): No bank accounts found, selectedAccountId cleared."); // <--- ЛОГ
        }
      } catch (err) {
        console.error("DEBUG(StatementUploadModal): Error fetching accounts:", err); // <--- ЛОГ
        setError("Не удалось загрузить список счетов.");
      }
    };
    
    if (isOpen && activeWorkspace) {
        fetchAccounts();
    }
    return () => console.log("DEBUG(StatementUploadModal): useEffect for accounts cleanup."); // <--- ЛОГ
  }, [isOpen, activeWorkspace]);

  // Сброс состояния при закрытии модального окна
  useEffect(() => {
    console.log("DEBUG(StatementUploadModal): useEffect for modal close/reset. isOpen:", isOpen); // <--- ЛОГ
    if (!isOpen) {
      setSelectedFile(null);
      setUploadResult(null);
      setError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        console.log("DEBUG(StatementUploadModal): File input cleared via ref."); // <--- ЛОГ
      }
      console.log("DEBUG(StatementUploadModal): Modal state reset."); // <--- ЛОГ
    }
  }, [isOpen]);


  const handleFileChange = (event) => {
    console.log("DEBUG(StatementUploadModal): handleFileChange called. Event target files:", event.target.files); // <--- ЛОГ
    setSelectedFile(event.target.files[0]);
    setUploadResult(null); 
    setError('');
    console.log("DEBUG(StatementUploadModal): selectedFile set to:", event.target.files[0] ? event.target.files[0].name : 'null'); // <--- ЛОГ
  };

  const handleUpload = async () => {
    console.log("DEBUG(StatementUploadModal): handleUpload called."); // <--- ЛОГ
    if (!selectedFile) {
      setError('Пожалуйста, выберите файл.');
      console.warn("DEBUG(StatementUploadModal): No file selected."); // <--- ЛОГ
      return;
    }
    if (!selectedAccountId) { 
        setError('Пожалуйста, выберите счет, к которому относится выписка.');
        console.warn("DEBUG(StatementUploadModal): No account selected."); // <--- ЛОГ
        return;
    }
    setLoading(true);
    setError('');
    setUploadResult(null);

    console.log("DEBUG(Upload): selectedFile before FormData:", selectedFile); 
    console.log("DEBUG(Upload): Type of selectedFile:", typeof selectedFile); 
    if (selectedFile) { 
        console.log("DEBUG(Upload): selectedFile name:", selectedFile.name); 
        console.log("DEBUG(Upload): selectedFile size:", selectedFile.size); 
        console.log("DEBUG(Upload): selectedFile type:", selectedFile.type); 
    }

    const formData = new FormData();
    formData.append('file', selectedFile); 
    formData.append('account_id', selectedAccountId); 

    // Проверка содержимого FormData
    for (let [key, value] of formData.entries()) {
        console.log(`DEBUG(Upload): FormData entry: ${key}: ${value}`);
    }
    console.log("DEBUG(Upload): FormData prepared. Sending request..."); // <--- ЛОГ

    const uploadUrl = `/statement/upload`; 

    try {
      // ИЗМЕНЕНО: Удален параметр headers полностью!
      const result = await apiService.post(uploadUrl, formData); // <--- ИСПРАВЛЕНО ЗДЕСЬ!
      setUploadResult(result);
      if (onSuccess) {
        onSuccess(); 
      }
      console.log("DEBUG(Upload): File uploaded successfully. Result:", result);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки файла.');
      console.error('DEBUG(Upload): Error during file upload:', err);
    } finally {
      setLoading(false);
      console.log("DEBUG(Upload): handleUpload finished. Loading set to false.");
    }
  };

  const accountOptions = accounts.map(acc => ({ value: acc.id.toString(), label: `${acc.name} (${acc.currency})` }));


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Загрузить банковскую выписку">
      <div className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        {uploadResult && (
          <Alert type="success">
            Файл успешно загружен. Создано транзакций: {uploadResult.created_transactions_auto} / Пропущено дубликатов: {uploadResult.skipped_duplicates_count} / Ошибок: {uploadResult.failed_rows}
            {uploadResult.failed_row_details && uploadResult.failed_row_details.length > 0 && (
              <div className="mt-2 text-sm">
                Подробнее об ошибках:
                <ul className="list-disc pl-5">
                  {uploadResult.failed_row_details.map((detail, index) => (
                    <li key={index}>{detail.error} (Строка: {JSON.stringify(detail.row)})</li>
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
            >
                <option value="">Выберите счет</option>
                {accountOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </Select>
        </div>

        <div>
          <Label htmlFor="file_upload">Выберите файл выписки (.csv)</Label> 
          <input 
            type="file" 
            id="file_upload" 
            ref={fileInputRef} 
            accept=".csv" 
            onChange={handleFileChange} 
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
          /> 
          {selectedFile && <p className="mt-2 text-sm text-gray-500">Выбран файл: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>}
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="secondary" className="mr-2">Отмена</Button>
          <Button onClick={handleUpload} disabled={loading}>{loading ? 'Загрузка...' : 'Загрузить'}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default StatementUploadModal;