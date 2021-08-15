import { ApiBrokerClient } from '@atek-cloud/api-broker';
// Generated file
class AccountsAPIClient extends ApiBrokerClient {
    constructor() {
        super({
            "id": "atek.cloud/accounts-api",
            "type": "api",
            "title": "Accounts API",
            "definition": {
                "methods": {
                    "create": {
                        "description": "Create a new user account.",
                        "params": [
                            {
                                "name": "opts",
                                "type": "object",
                                "required": [
                                    "username",
                                    "password"
                                ],
                                "properties": {
                                    "username": {
                                        "type": "string"
                                    },
                                    "password": {
                                        "type": "string"
                                    }
                                }
                            }
                        ],
                        "response": {
                            "type": "object",
                            "required": [
                                "id",
                                "username"
                            ],
                            "properties": {
                                "id": {
                                    "type": "string"
                                },
                                "username": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "list": {
                        "description": "List all user accounts.",
                        "response": {
                            "type": "object",
                            "required": [
                                "accounts"
                            ],
                            "properties": {
                                "accounts": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "required": [
                                            "id",
                                            "username"
                                        ],
                                        "properties": {
                                            "id": {
                                                "type": "string"
                                            },
                                            "username": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "get": {
                        "description": "Get a user account by its ID.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ],
                        "response": {
                            "type": "object",
                            "required": [
                                "id",
                                "username"
                            ],
                            "properties": {
                                "id": {
                                    "type": "string"
                                },
                                "username": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "getByUsername": {
                        "description": "Get a user account by its username.",
                        "params": [
                            {
                                "name": "username",
                                "type": "string"
                            }
                        ],
                        "response": {
                            "type": "object",
                            "required": [
                                "id",
                                "username"
                            ],
                            "properties": {
                                "id": {
                                    "type": "string"
                                },
                                "username": {
                                    "type": "string"
                                }
                            }
                        }
                    },
                    "delete": {
                        "description": "Delete a user account.",
                        "params": [
                            {
                                "name": "id",
                                "type": "string"
                            }
                        ]
                    }
                }
            }
        });
    }
    async create(opts: CreateOpts): Promise<Create_Response> {
        return this._rpc("create", [opts]);
    }
    async list(): Promise<List_Response> {
        return this._rpc("list", []);
    }
    async get(id: string): Promise<Get_Response> {
        return this._rpc("get", [id]);
    }
    async getByUsername(username: string): Promise<GetByUsername_Response> {
        return this._rpc("getByUsername", [username]);
    }
    async delete(id: string): Promise<undefined> {
        return this._rpc("delete", [id]);
    }
}
export type Create_Response = {
    id: string;
    username: string;
};
export type CreateOpts = {
    username: string;
    password: string;
};
export type List_Response = {
    accounts: ({
        id: string;
        username: string;
    })[];
};
export type Get_Response = {
    id: string;
    username: string;
};
export type GetByUsername_Response = {
    id: string;
    username: string;
};
const client: AccountsAPIClient = new AccountsAPIClient();
export default client;
