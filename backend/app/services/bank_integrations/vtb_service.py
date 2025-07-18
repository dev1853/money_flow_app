class VTBService:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret

    def get_access_token(self):
        # TODO: Реализовать OAuth для ВТБ
        pass

    def get_transactions(self, access_token: str):
        # TODO: Получение выписки по API ВТБ
        pass 