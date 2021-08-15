import { ApiBrokerServer, ApiBrokerServerHandlers } from '@atek-cloud/api-broker';
// Generated file
export default class AccountsAPIServer extends ApiBrokerServer {
    constructor(handlers: ApiBrokerServerHandlers) {
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
        }, handlers);
    }
}
