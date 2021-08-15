import { ApiBrokerClient } from '@atek-cloud/api-broker';
// Generated file
class SystemAPIClient extends ApiBrokerClient {
    constructor() {
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
        });
    }
    async getBucket(bucketId: string): Promise<GetBucket_Response> {
        return this._rpc("getBucket", [bucketId]);
    }
}
export type GetBucket_Response = {
    id: string;
    type: (("bucket:root" | "bucket:app" | "bucket:trash" | "db") & string);
    title: string;
    description?: string;
    items: ({
        id: string;
        type: (("bucket:root" | "bucket:app" | "bucket:trash" | "db") & string);
        title: string;
        description?: string;
    })[];
};
const client: SystemAPIClient = new SystemAPIClient();
export default client;
