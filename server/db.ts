import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const ORIGINAL_DATA_DIR = path.join(process.cwd(), "data");
const DATA_DIR = process.env.VERCEL ? "/tmp/data" : ORIGINAL_DATA_DIR;

// Helper to ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (process.env.VERCEL) {
    try {
      if (fs.existsSync(ORIGINAL_DATA_DIR)) {
        const files = fs.readdirSync(ORIGINAL_DATA_DIR);
        for (const file of files) {
          const src = path.join(ORIGINAL_DATA_DIR, file);
          const dest = path.join(DATA_DIR, file);
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(src, dest);
          }
        }
      }
    } catch (e) {
      console.error("Failed to copy pre-seeded data files to /tmp/data:", e);
    }
  }
}

export interface Admin {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface Elector {
  id: string;
  registerNumber: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  registerNumber: string;
  electionId: string;
  createdAt: string;
  photo?: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Active" | "Closed";
  createdAt: string;
}

export interface Vote {
  id: string;
  electorId: string;
  electionId: string;
  candidateId: string;
  votedAt: string;
}

export class Collection<T extends { id: string }> {
  private filePath: string;

  constructor(collectionName: string) {
    ensureDataDir();
    this.filePath = path.join(DATA_DIR, `${collectionName.toLowerCase()}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), "utf8");
    }
  }

  private read(): T[] {
    try {
      const content = fs.readFileSync(this.filePath, "utf8");
      return JSON.parse(content) as T[];
    } catch (e) {
      return [];
    }
  }

  private write(data: T[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
  }

  public find(filter?: Partial<T>): T[] {
    const items = this.read();
    if (!filter) return items;
    return items.filter((item) => {
      for (const key in filter) {
        if (item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  }

  public findOne(filter: Partial<T>): T | null {
    const items = this.find(filter);
    return items.length > 0 ? items[0] : null;
  }

  public findById(id: string): T | null {
    return this.findOne({ id } as unknown as Partial<T>);
  }

  public create(data: Omit<T, "id"> & { id?: string }): T {
    const items = this.read();
    const newItem = {
      ...data,
      id: data.id || Math.random().toString(36).substring(2, 11),
    } as T;
    items.push(newItem);
    this.write(items);
    return newItem;
  }

  public findByIdAndUpdate(id: string, update: Partial<T>): T | null {
    const items = this.read();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    items[index] = { ...items[index], ...update };
    this.write(items);
    return items[index];
  }

  public findByIdAndDelete(id: string): boolean {
    const items = this.read();
    const lengthBefore = items.length;
    const filtered = items.filter((item) => item.id !== id);
    this.write(filtered);
    return filtered.length < lengthBefore;
  }

  public deleteMany(filter: Partial<T>): number {
    const items = this.read();
    const filtered = items.filter((item) => {
      for (const key in filter) {
        if (item[key] === filter[key]) {
          return false;
        }
      }
      return true;
    });
    const deletedCount = items.length - filtered.length;
    this.write(filtered);
    return deletedCount;
  }

  public count(filter?: Partial<T>): number {
    return this.find(filter).length;
  }
}

// Instantiate Collections
export const Admins = new Collection<Admin>("admins");
export const Electors = new Collection<Elector>("electors");
export const Candidates = new Collection<Candidate>("candidates");
export const Elections = new Collection<Election>("elections");
export const Votes = new Collection<Vote>("votes");

// Pre-seed default data if empty
export function seedDatabase() {
  const seedFile = path.join(DATA_DIR, ".seeded");
  if (fs.existsSync(seedFile)) {
    console.log("Database has already been seeded before.");
    return;
  }

  console.log("Checking database seed status...");

  // Seed Admin
  if (Admins.count() === 0) {
    const defaultPasswordHash = bcrypt.hashSync("admin123", 10);
    Admins.create({
      username: "admin",
      name: "Super Administrator",
      passwordHash: defaultPasswordHash,
      createdAt: new Date().toISOString(),
    });
    console.log("Seeded Admin: admin / admin123");
  }

  // Seed Electors (Default password "DSU")
  if (Electors.count() === 0) {
    const defaultElectorHash = bcrypt.hashSync("DSU", 10);
    const demoElectors = [
      { registerNumber: "101", name: "Abishek R" },
      { registerNumber: "102", name: "Deepak Kumar" },
      { registerNumber: "103", name: "Harini S" },
      { registerNumber: "104", name: "Karthik Raja" },
      { registerNumber: "105", name: "Pooja Hegde" },
      { registerNumber: "106", name: "Ganesh M" },
      { registerNumber: "107", name: "Sanjay Dutta" },
      { registerNumber: "108", name: "Vijay Prasad" },
      { registerNumber: "109", name: "Meghana Rao" },
      { registerNumber: "110", name: "Nithin Kumar" },
    ];

    demoElectors.forEach((elector) => {
      Electors.create({
        registerNumber: elector.registerNumber,
        name: elector.name,
        passwordHash: defaultElectorHash,
        createdAt: new Date().toISOString(),
      });
    });
    console.log(`Seeded ${demoElectors.length} demo electors with password 'DSU'`);
  }

  // Seed Elections and Candidates
  if (Elections.count() === 0) {
    const now = new Date();
    
    // 1. President Election (Active)
    const activeStartDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
    const activeEndDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days from now
    const e1 = Elections.create({
      title: "Student Council President Election",
      description: "University-wide election to select the next Student Council President to lead academic and extracurricular initiatives.",
      startDate: activeStartDate,
      endDate: activeEndDate,
      status: "Active",
      createdAt: now.toISOString(),
    });

    Candidates.create({ name: "Arun Kumar", registerNumber: "REG01", electionId: e1.id, createdAt: now.toISOString() });
    Candidates.create({ name: "Meera Sen", registerNumber: "REG02", electionId: e1.id, createdAt: now.toISOString() });
    Candidates.create({ name: "Rahul Sharma", registerNumber: "REG03", electionId: e1.id, createdAt: now.toISOString() });

    // 2. Vice President Election (Active)
    const vpStartDate = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    const vpEndDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day from now
    const e2 = Elections.create({
      title: "Vice President Election",
      description: "College election to appoint the Vice President responsible for supporting student committees and events.",
      startDate: vpStartDate,
      endDate: vpEndDate,
      status: "Active",
      createdAt: now.toISOString(),
    });

    Candidates.create({ name: "Divya N", registerNumber: "REG04", electionId: e2.id, createdAt: now.toISOString() });
    Candidates.create({ name: "Sohan Singh", registerNumber: "REG05", electionId: e2.id, createdAt: now.toISOString() });

    // 3. Cultural Secretary Election (Upcoming)
    const upcomingStartDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days from now
    const upcomingEndDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days from now
    const e3 = Elections.create({
      title: "Cultural Secretary Election",
      description: "Annual cultural secretary election to plan, manage, and coordinate the university national-level fest.",
      startDate: upcomingStartDate,
      endDate: upcomingEndDate,
      status: "Upcoming",
      createdAt: now.toISOString(),
    });

    Candidates.create({ name: "Vikram Malhotra", registerNumber: "REG06", electionId: e3.id, createdAt: now.toISOString() });
    Candidates.create({ name: "Sneha Reddy", registerNumber: "REG07", electionId: e3.id, createdAt: now.toISOString() });

    // 4. Sports Captain Election (Closed)
    const closedStartDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
    const closedEndDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
    const e4 = Elections.create({
      title: "Sports Captain Election",
      description: "Election to select the sports captain representing our university in athletic tournaments.",
      startDate: closedStartDate,
      endDate: closedEndDate,
      status: "Closed",
      createdAt: now.toISOString(),
    });

    const cKabir = Candidates.create({ name: "Kabir Singh", registerNumber: "REG08", electionId: e4.id, createdAt: now.toISOString() });
    const cRohan = Candidates.create({ name: "Rohan Das", registerNumber: "REG09", electionId: e4.id, createdAt: now.toISOString() });

    // Seed some votes for the closed election
    const electorsList = Electors.find();
    // Elector 101-105 votes Kabir, 106-108 votes Rohan
    if (electorsList.length >= 8) {
      Votes.create({ electorId: electorsList[0].id, electionId: e4.id, candidateId: cKabir.id, votedAt: closedStartDate });
      Votes.create({ electorId: electorsList[1].id, electionId: e4.id, candidateId: cKabir.id, votedAt: closedStartDate });
      Votes.create({ electorId: electorsList[2].id, electionId: e4.id, candidateId: cKabir.id, votedAt: closedStartDate });
      Votes.create({ electorId: electorsList[3].id, electionId: e4.id, candidateId: cKabir.id, votedAt: closedStartDate });
      Votes.create({ electorId: electorsList[4].id, electionId: e4.id, candidateId: cKabir.id, votedAt: closedStartDate });
      Votes.create({ electorId: electorsList[5].id, electionId: e4.id, candidateId: cRohan.id, votedAt: closedStartDate });
      Votes.create({ electorId: electorsList[6].id, electionId: e4.id, candidateId: cRohan.id, votedAt: closedStartDate });
      Votes.create({ electorId: electorsList[7].id, electionId: e4.id, candidateId: cRohan.id, votedAt: closedStartDate });
    }

    console.log("Seeded elections, candidates, and historical votes successfully!");
  }

  // Save the seed completion marker
  try {
    fs.writeFileSync(seedFile, "true", "utf8");
  } catch (err) {
    console.error("Failed to write seed marker file:", err);
  }
}
