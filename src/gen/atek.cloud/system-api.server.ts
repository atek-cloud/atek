import { ApiBrokerServer, ApiBrokerServerHandlers } from '@atek-cloud/api-broker';
// Generated file
export default class SystemAPIServer extends ApiBrokerServer {
    constructor(handlers: ApiBrokerServerHandlers) {
        super({
            "id": "atek.cloud/system-api",
            "type": "api",
            "title": "System API",
            "description": "General management and configuration APIs for a host environment.",
            "definition": {
                "methods": {
                    "getBucket": {
                        "description": "Enumerate information attached to a \"bucket\" namespace. This can include databases and other buckets.",
                        "params": {
                            "type": "array",
                            "minLength": 1,
                            "items": [
                                {
                                    "name": "bucketId",
                                    "type": "string"
                                }
                            ]
                        },
                        "response": {
                            "type": "object",
                            "required": [
                                "id",
                                "type",
                                "title",
                                "items"
                            ],
                            "properties": {
                                "id": {
                                    "type": "string"
                                },
                                "type": {
                                    "type": "string",
                                    "enum": [
                                        "bucket:root",
                                        "bucket:app",
                                        "bucket:trash",
                                        "db"
                                    ]
                                },
                                "title": {
                                    "type": "string"
                                },
                                "description": {
                                    "type": "string"
                                },
                                "items": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "required": [
                                            "id",
                                            "type",
                                            "title"
                                        ],
                                        "properties": {
                                            "id": {
                                                "type": "string"
                                            },
                                            "type": {
                                                "type": "string",
                                                "enum": [
                                                    "bucket:root",
                                                    "bucket:app",
                                                    "bucket:trash",
                                                    "db"
                                                ]
                                            },
                                            "title": {
                                                "type": "string"
                                            },
                                            "description": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }, handlers);
    }
}
