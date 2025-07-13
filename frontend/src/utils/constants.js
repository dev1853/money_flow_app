// frontend/src/utils/constants.js

export const ContractStatus = {
    ACTIVE: "active",
    COMPLETED: "completed",
    ARCHIVED: "archived",
    PENDING: "pending",
};

export const CounterpartyType = {
    CLIENT: "client",
    SUPPLIER: "supplier",
    EMPLOYEE: "employee",
    OTHER: "other",
};

export const TransactionType = { // Убедитесь, что это определено
    INCOME: "INCOME",   // ИСПРАВЛЕНО: изменено на верхний регистр
    EXPENSE: "EXPENSE", // ИСПРАВЛЕНО: изменено на верхний регистр
    TRANSFER: "TRANSFER", // ИСПРАВЛЕНО: изменено на верхний регистр
};