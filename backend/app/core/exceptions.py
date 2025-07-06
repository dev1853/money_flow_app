# /core/exceptions.py

class BaseAppException(Exception):
    """Базовый класс для всех кастомных исключений в приложении."""
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)
        
class BusinessLogicError(Exception):
    """Базовый класс для всех бизнес-ошибок в приложении."""
    @property
    def detail(self) -> str:
        return "Произошла ошибка бизнес-логики."

class UserAlreadyExistsError(BusinessLogicError):
    """Выбрасывается, когда пользователь с таким email уже существует."""
    def __init__(self, email: str):
        self.email = email

    @property
    def detail(self) -> str:
        return f"Пользователь с email '{self.email}' уже существует."
    
class PermissionDeniedError(BaseAppException):
    pass

class NotFoundError(BusinessLogicError):
    """Базовый класс для ошибок 'не найдено'."""
    def __init__(self, resource: str, resource_id: int):
        self.resource = resource
        self.resource_id = resource_id
    
    @property
    def detail(self) -> str:
        return f"Ресурс '{self.resource}' с ID {self.resource_id} не найден."
    
class AccountNotFoundError(BusinessLogicError):
    """Выбрасывается, когда счет не найден в базе данных."""
    def __init__(self, account_id: int):
        self.account_id = account_id

    @property
    def detail(self) -> str:
        return f"Счет с ID {self.account_id} не найден."
        
class DdsArticleNotFoundError(BusinessLogicError):
    """Выбрасывается, когда статья ДДС не найдена в базе данных."""
    def __init__(self, dds_article_id: int):
        self.dds_article_id = dds_article_id

    @property
    def detail(self) -> str:
        return f"Статья ДДС с ID {self.dds_article_id} не найдена."

class WorkspaceAccessDenied(Exception):
    def __str__(self):
        return "Доступ к рабочему пространству запрещен."
    
class DuplicateMappingRuleError(Exception):
    def __init__(self, detail: str = "Правило с таким ключевым словом уже существует."):
        self.detail = detail

class DdsArticleInvalidError(Exception):
    def __init__(self, detail: str = "Указанная статья ДДС некорректна или недоступна."):
        self.detail = detail

class AccountDeletionError(Exception):
    def __init__(self, detail: str = "Невозможно удалить счет."):
        self.detail = detail
        
class DuplicateEntryError(BaseAppException):
    """Исключение для дублирующихся записей."""
    pass

class DdsArticleHasChildrenError(BaseAppException):
    """Исключение при попытке удалить статью ДДС с дочерними элементами."""
    pass

class DdsArticleInUseError(BaseAppException):
    """Исключение при попытке удалить статью ДДС, которая используется в транзакциях."""
    pass