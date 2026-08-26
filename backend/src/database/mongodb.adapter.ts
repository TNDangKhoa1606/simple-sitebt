import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import { DatabaseAdapter, StoredMessage, StoredVisit } from './database.types';

interface VisitDocument {
  _id?: ObjectId;
  createdAt: Date;
}

interface MessageDocument extends VisitDocument {
  text: string;
}

export class MongoDbAdapter implements DatabaseAdapter {
  private readonly client: MongoClient;
  private db: Db;

  constructor(
    uri: string,
    database: string,
    private readonly autoCreateSchema: boolean,
  ) {
    this.client = new MongoClient(uri);
    this.db = this.client.db(database);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    if (this.autoCreateSchema) {
      await this.messages.createIndex({ createdAt: -1 });
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async recordVisit(): Promise<StoredVisit> {
    const createdAt = new Date();
    const result = await this.visits.insertOne({ createdAt });
    return { id: result.insertedId.toHexString(), createdAt };
  }

  async countVisits(): Promise<number> {
    return this.visits.countDocuments();
  }

  async listMessages(limit: number): Promise<StoredMessage[]> {
    const documents = await this.messages
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return documents.map((document) => ({
      id: document._id.toHexString(),
      text: document.text,
      createdAt: document.createdAt,
    }));
  }

  async saveMessage(text: string): Promise<StoredMessage> {
    const createdAt = new Date();
    const result = await this.messages.insertOne({ text, createdAt });
    return { id: result.insertedId.toHexString(), text, createdAt };
  }

  async ping(): Promise<void> {
    await this.db.command({ ping: 1 });
  }

  private get visits(): Collection<VisitDocument> {
    return this.db.collection<VisitDocument>('visits');
  }

  private get messages(): Collection<MessageDocument> {
    return this.db.collection<MessageDocument>('messages');
  }
}
