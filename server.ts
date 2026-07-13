import express, { Request, Response, NextFunction } from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ExcelJS from "exceljs";
import {
  Admins,
  Electors,
  Candidates,
  Elections,
  Votes,
  seedDatabase,
  Election,
} from "./server/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dsu-election-secret-key-2026";
const PORT = 3000;

// Initialize & Seed Database
seedDatabase();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "elector";
    registerNumber?: string;
    username?: string;
    name: string;
  };
}

// Authentication Middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  // Fallback to query parameter for file downloads
  if (!token && req.query.authorization) {
    token = req.query.authorization as string;
  }

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = decoded;
    next();
  });
}

// Admin checking middleware
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

// Function to dynamically update election statuses based on date/time
function updateAndGetElections(): Election[] {
  const electionsList = Elections.find();
  const now = new Date();
  let updated = false;

  const processed = electionsList.map((election) => {
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);
    let newStatus = election.status;

    if (now < start) {
      newStatus = "Upcoming";
    } else if (now >= start && now <= end) {
      // If manually closed, respect that unless dates force otherwise
      if (election.status !== "Closed") {
        newStatus = "Active";
      }
    } else {
      newStatus = "Closed";
    }

    if (newStatus !== election.status) {
      Elections.findByIdAndUpdate(election.id, { status: newStatus });
      updated = true;
      return { ...election, status: newStatus };
    }
    return election;
  });

  return processed;
}

const app = express();
app.use(express.json({ limit: "50mb" }));

  // ==========================================
  // AUTHENTICATION APIs
  // ==========================================

  // Elector Login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { registerNumber, password } = req.body;

    if (!registerNumber || !password) {
      res.status(400).json({ error: "Register number and password are required" });
      return;
    }

    const elector = Electors.findOne({ registerNumber });
    if (!elector) {
      res.status(401).json({ error: "Invalid register number or password" });
      return;
    }

    const isMatch = bcrypt.compareSync(password, elector.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid register number or password" });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: elector.id,
        role: "elector",
        registerNumber: elector.registerNumber,
        name: elector.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: elector.id,
        role: "elector",
        registerNumber: elector.registerNumber,
        name: elector.name,
      },
    });
  });

  // Admin Login
  app.post("/api/auth/admin/login", (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const admin = Admins.findOne({ username });
    if (!admin) {
      res.status(401).json({ error: "Invalid admin username or password" });
      return;
    }

    const isMatch = bcrypt.compareSync(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid admin username or password" });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: admin.id,
        role: "admin",
        username: admin.username,
        name: admin.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        role: "admin",
        username: admin.username,
        name: admin.name,
      },
    });
  });

  // Check Auth Status
  app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res: Response) => {
    res.json({ user: req.user });
  });

  // ==========================================
  // ELECTION APIs
  // ==========================================

  // Get Elections
  app.get("/api/elections", authenticateToken, (req: AuthRequest, res: Response) => {
    const elections = updateAndGetElections();
    
    // Add additional info like voter participation
    const userId = req.user?.id;
    const isElector = req.user?.role === "elector";

    const responseData = elections.map((election) => {
      const candidatesCount = Candidates.count({ electionId: election.id });
      const totalVotes = Votes.count({ electionId: election.id });
      
      let hasVoted = false;
      let votedCandidateId = "";
      if (isElector && userId) {
        const existingVote = Votes.findOne({ electionId: election.id, electorId: userId });
        if (existingVote) {
          hasVoted = true;
          votedCandidateId = existingVote.candidateId;
        }
      }

      return {
        ...election,
        candidatesCount,
        totalVotes,
        hasVoted,
        votedCandidateId,
      };
    });

    res.json(responseData);
  });

  // Create Election (Admin)
  app.post("/api/elections", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { title, description, startDate, endDate, status } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({ error: "Title, start date, and end date are required" });
      return;
    }

    const newElection = Elections.create({
      title,
      description: description || "",
      startDate,
      endDate,
      status: status || "Upcoming",
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(newElection);
  });

  // Edit Election (Admin)
  app.put("/api/elections/:id", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, description, startDate, endDate, status } = req.body;

    const election = Elections.findById(id);
    if (!election) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    const updated = Elections.findByIdAndUpdate(id, {
      title: title || election.title,
      description: description !== undefined ? description : election.description,
      startDate: startDate || election.startDate,
      endDate: endDate || election.endDate,
      status: status || election.status,
    });

    res.json(updated);
  });

  // Delete Election (Admin)
  app.delete("/api/elections/:id", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const election = Elections.findById(id);
    if (!election) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    // Cascade delete candidates and votes
    Candidates.deleteMany({ electionId: id });
    Votes.deleteMany({ electionId: id });
    Elections.findByIdAndDelete(id);

    res.json({ message: "Election and all associated candidates & votes deleted successfully" });
  });

  // ==========================================
  // CANDIDATE APIs
  // ==========================================

  // Get Candidates for an Election
  app.get("/api/elections/:electionId/candidates", authenticateToken, (req: AuthRequest, res: Response) => {
    const { electionId } = req.params;
    const list = Candidates.find({ electionId });
    res.json(list);
  });

  // Add Candidate (Admin)
  app.post("/api/candidates", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { name, registerNumber, electionId, photo } = req.body;

    if (!name || !registerNumber || !electionId) {
      res.status(400).json({ error: "Name, register number, and election ID are required" });
      return;
    }

    // Check if candidate already registered in this election
    const existing = Candidates.findOne({ registerNumber, electionId });
    if (existing) {
      res.status(400).json({ error: "A candidate with this Register Number is already added to this election" });
      return;
    }

    const newCandidate = Candidates.create({
      name,
      registerNumber,
      electionId,
      photo: photo || "",
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(newCandidate);
  });

  // Edit Candidate (Admin)
  app.put("/api/candidates/:id", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, registerNumber, photo } = req.body;

    const candidate = Candidates.findById(id);
    if (!candidate) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }

    const updated = Candidates.findByIdAndUpdate(id, {
      name: name || candidate.name,
      registerNumber: registerNumber || candidate.registerNumber,
      photo: photo !== undefined ? photo : candidate.photo,
    });

    res.json(updated);
  });

  // Delete Candidate (Admin)
  app.delete("/api/candidates/:id", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const candidate = Candidates.findById(id);
    if (!candidate) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }

    // Cascade delete any votes cast for this candidate (optional, or we can keep votes as invalid)
    Votes.deleteMany({ candidateId: id });
    Candidates.findByIdAndDelete(id);

    res.json({ message: "Candidate deleted successfully" });
  });

  // ==========================================
  // ELECTOR APIs
  // ==========================================

  // Get Electors with Search & Pagination (Admin)
  app.get("/api/electors", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const search = (req.query.search as string || "").toLowerCase();
    const page = parseInt(req.query.page as string || "1", 10);
    const limit = parseInt(req.query.limit as string || "10", 10);

    let list = Electors.find();

    if (search) {
      list = list.filter(
        (el) =>
          el.name.toLowerCase().includes(search) ||
          el.registerNumber.toLowerCase().includes(search)
      );
    }

    // Sort by createdAt desc
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    res.json({
      electors: paginated,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  });

  // Add Elector Manually (Admin)
  app.post("/api/electors", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { name, registerNumber } = req.body;

    if (!name || !registerNumber) {
      res.status(400).json({ error: "Name and Register Number are required" });
      return;
    }

    const existing = Electors.findOne({ registerNumber });
    if (existing) {
      res.status(400).json({ error: "An elector with this Register Number already exists" });
      return;
    }

    const defaultPasswordHash = bcrypt.hashSync("DSU", 10);
    const elector = Electors.create({
      name,
      registerNumber,
      passwordHash: defaultPasswordHash,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(elector);
  });

  // Bulk Upload Electors (Admin)
  app.post("/api/electors/bulk", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { electors } = req.body; // Expecting array of { name, registerNumber }

    if (!Array.isArray(electors) || electors.length === 0) {
      res.status(400).json({ error: "Electors list must be an array" });
      return;
    }

    const defaultPasswordHash = bcrypt.hashSync("DSU", 10);
    let addedCount = 0;
    let duplicateCount = 0;

    electors.forEach((e) => {
      if (!e.name || !e.registerNumber) return;
      
      const registerNumberStr = String(e.registerNumber).trim();
      const existing = Electors.findOne({ registerNumber: registerNumberStr });
      if (existing) {
        duplicateCount++;
      } else {
        Electors.create({
          name: String(e.name).trim(),
          registerNumber: registerNumberStr,
          passwordHash: defaultPasswordHash,
          createdAt: new Date().toISOString(),
        });
        addedCount++;
      }
    });

    res.json({
      message: `Bulk processing completed. Added: ${addedCount}, Duplicates ignored: ${duplicateCount}`,
      addedCount,
      duplicateCount,
    });
  });

  // Delete All Electors (Admin)
  app.delete("/api/electors", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    try {
      const electors = Electors.find();
      electors.forEach((el) => {
        Votes.deleteMany({ electorId: el.id });
        Electors.findByIdAndDelete(el.id);
      });
      res.json({ message: "All electors and their associated votes have been successfully deleted" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to clear elector database" });
    }
  });

  // Delete Elector (Admin)
  app.delete("/api/electors/:id", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const elector = Electors.findById(id);
    if (!elector) {
      res.status(404).json({ error: "Elector not found" });
      return;
    }

    // Cascade delete votes
    Votes.deleteMany({ electorId: id });
    Electors.findByIdAndDelete(id);

    res.json({ message: "Elector and their votes deleted successfully" });
  });

  // ==========================================
  // VOTING APIs
  // ==========================================

  // Cast Vote (Elector)
  app.post("/api/votes", authenticateToken, (req: AuthRequest, res: Response) => {
    const { electionId, candidateId } = req.body;
    const electorId = req.user?.id;

    if (req.user?.role !== "elector" || !electorId) {
      res.status(403).json({ error: "Only electors can vote" });
      return;
    }

    if (!electionId || !candidateId) {
      res.status(400).json({ error: "Election ID and Candidate ID are required" });
      return;
    }

    // Validate election exists and is Active
    const electionsList = updateAndGetElections();
    const election = electionsList.find(e => e.id === electionId);

    if (!election) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    if (election.status !== "Active") {
      res.status(400).json({ error: `Voting is not open. Election is currently ${election.status}` });
      return;
    }

    // Validate if candidates belong to the election
    const candidate = Candidates.findById(candidateId);
    if (!candidate || candidate.electionId !== electionId) {
      res.status(400).json({ error: "Invalid candidate for this election" });
      return;
    }

    // Check duplicate voting
    const existingVote = Votes.findOne({ electionId, electorId });
    if (existingVote) {
      res.status(400).json({ error: "You have already voted in this election. Duplicate voting is prevented." });
      return;
    }

    // Save vote
    Votes.create({
      electorId,
      electionId,
      candidateId,
      votedAt: new Date().toISOString(),
    });

    res.json({ message: "Vote Submitted Successfully" });
  });

  // Get elector voting history (Elector)
  app.get("/api/electors/history", authenticateToken, (req: AuthRequest, res: Response) => {
    const electorId = req.user?.id;
    if (req.user?.role !== "elector" || !electorId) {
      res.status(403).json({ error: "Only electors can retrieve vote history" });
      return;
    }

    const votes = Votes.find({ electorId });
    const history = votes.map((v) => {
      const election = Elections.findById(v.electionId);
      const candidate = Candidates.findById(v.candidateId);
      return {
        id: v.id,
        electionId: v.electionId,
        electionTitle: election ? election.title : "Unknown Election",
        candidateId: v.candidateId,
        candidateName: candidate ? candidate.name : "Unknown Candidate",
        votedAt: v.votedAt,
      };
    });

    res.json(history);
  });

  // ==========================================
  // ANALYTICS & STATS APIs
  // ==========================================

  // Dashboard Statistics (Admin)
  app.get("/api/stats", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const totalElectors = Electors.count();
    const elections = updateAndGetElections();
    const totalElections = elections.length;
    const totalCandidates = Candidates.count();
    const totalVotesCast = Votes.count();

    // Get unique voters who voted at least once
    const uniqueVotersSet = new Set(Votes.find().map((v) => v.electorId));
    const uniqueVotersCount = uniqueVotersSet.size;

    const pendingVoters = Math.max(0, totalElectors - uniqueVotersCount);
    
    // Overall Turnout percentage across all elections
    let turnoutPercentage = 0;
    if (totalElectors > 0 && totalElections > 0) {
      const activeOrClosedElections = elections.filter(e => e.status !== "Upcoming").length;
      if (activeOrClosedElections > 0) {
        // Average turnout across running/closed elections
        turnoutPercentage = Math.round((totalVotesCast / (totalElectors * activeOrClosedElections)) * 100);
      } else {
        turnoutPercentage = 0;
      }
    }
    // Cap turnout percentage at 100%
    if (turnoutPercentage > 100) turnoutPercentage = 100;

    // Build Recent Activities
    const recentVotes = Votes.find();
    recentVotes.sort((a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime());
    
    interface ActivityLogItem {
      type: string;
      electorName: string;
      electorReg: string;
      electionTitle: string;
      candidateName?: string;
      timestamp: string;
    }

    const activityLog: ActivityLogItem[] = recentVotes.slice(0, 10).map((v) => {
      const elector = Electors.findById(v.electorId);
      const election = Elections.findById(v.electionId);
      const candidate = Candidates.findById(v.candidateId);
      return {
        type: "vote_cast",
        electorName: elector ? elector.name : "System Elector",
        electorReg: elector ? elector.registerNumber : "N/A",
        electionTitle: election ? election.title : "General Election",
        candidateName: candidate ? candidate.name : "Unknown Candidate",
        timestamp: v.votedAt,
      };
    });

    // Add in some administrative activities for aesthetic richness
    elections.slice(0, 3).forEach((e) => {
      activityLog.push({
        type: "election_created",
        electorName: "System",
        electorReg: "Admin",
        electionTitle: e.title,
        timestamp: e.createdAt,
      });
    });

    // Sort combined activities by timestamp desc
    activityLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      totalElectors,
      totalElections,
      totalCandidates,
      totalVotesCast,
      pendingVoters,
      votingPercentage: turnoutPercentage,
      recentActivity: activityLog.slice(0, 10),
    });
  });

  // Get Detailed Results for a Specific Election
  app.get("/api/results/:electionId", authenticateToken, (req: AuthRequest, res: Response) => {
    const { electionId } = req.params;

    const election = Elections.findById(electionId);
    if (!election) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    const candidates = Candidates.find({ electionId });
    const votes = Votes.find({ electionId });
    const totalVotes = votes.length;

    const candidatesWithVotes = candidates.map((c) => {
      const voteCount = votes.filter((v) => v.candidateId === c.id).length;
      const percentage = totalVotes > 0 ? parseFloat(((voteCount / totalVotes) * 100).toFixed(1)) : 0;
      return {
        id: c.id,
        name: c.name,
        registerNumber: c.registerNumber,
        voteCount,
        percentage,
      };
    });

    // Sort candidate list by voteCount desc
    candidatesWithVotes.sort((a, b) => b.voteCount - a.voteCount);

    // Determine Winner
    let winner = null;
    if (totalVotes > 0 && candidatesWithVotes.length > 0) {
      const maxVotes = candidatesWithVotes[0].voteCount;
      // Check if there's a tie
      const topCandidates = candidatesWithVotes.filter(c => c.voteCount === maxVotes);
      if (topCandidates.length === 1) {
        winner = topCandidates[0];
      } else {
        // It is a tie
        winner = {
          name: "Tie Match",
          registerNumber: "TIE",
          voteCount: maxVotes,
          percentage: topCandidates[0].percentage,
          isTie: true,
          tiedCandidates: topCandidates.map(tc => tc.name),
        };
      }
    }

    res.json({
      election,
      totalVotes,
      candidates: candidatesWithVotes,
      winner,
    });
  });

  // ==========================================
  // EXPORT EXCEL API
  // ==========================================

  app.get("/api/results/:electionId/export", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    const { electionId } = req.params;

    const election = Elections.findById(electionId);
    if (!election) {
      res.status(404).json({ error: "Election not found" });
      return;
    }

    const candidates = Candidates.find({ electionId });
    const votes = Votes.find({ electionId });
    const totalVotes = votes.length;

    const candidatesWithVotes = candidates.map((c) => {
      const voteCount = votes.filter((v) => v.candidateId === c.id).length;
      const percentage = totalVotes > 0 ? parseFloat(((voteCount / totalVotes) * 100).toFixed(1)) : 0;
      return {
        name: c.name,
        registerNumber: c.registerNumber,
        voteCount,
        percentage,
      };
    });

    candidatesWithVotes.sort((a, b) => b.voteCount - a.voteCount);

    // Find Winner Name
    let winnerText = "No Votes Cast";
    if (totalVotes > 0 && candidatesWithVotes.length > 0) {
      const maxVotes = candidatesWithVotes[0].voteCount;
      const topCandidates = candidatesWithVotes.filter(c => c.voteCount === maxVotes);
      if (topCandidates.length === 1) {
        winnerText = `${topCandidates[0].name} (${topCandidates[0].registerNumber})`;
      } else {
        winnerText = `Tie: ${topCandidates.map(tc => tc.name).join(", ")}`;
      }
    }

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Election Results");

    // Styled Title
    worksheet.mergeCells("A1:E1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "ONLINE ELECTION VOTING SYSTEM";
    titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }; // #0F172A
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 40;

    // Subheader Info Block
    worksheet.mergeCells("A2:E2");
    const subCell = worksheet.getCell("A2");
    subCell.value = `Election Name: ${election.title}`;
    subCell.font = { name: "Segoe UI", size: 11, bold: true };
    subCell.alignment = { horizontal: "left" };

    worksheet.mergeCells("A3:E3");
    const descCell = worksheet.getCell("A3");
    descCell.value = `Description: ${election.description}`;
    descCell.font = { name: "Segoe UI", size: 10, italic: true };

    worksheet.mergeCells("A4:C4");
    worksheet.getCell("A4").value = `Status: ${election.status}`;
    worksheet.getCell("A4").font = { name: "Segoe UI", size: 10, bold: true };

    worksheet.mergeCells("D4:E4");
    worksheet.getCell("D4").value = `Total Votes Cast: ${totalVotes}`;
    worksheet.getCell("D4").font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF2563EB" } };

    worksheet.mergeCells("A5:E5");
    const winnerCell = worksheet.getCell("A5");
    winnerCell.value = `Declared Winner: ${winnerText}`;
    winnerCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF22C55E" } };

    // Empty row
    worksheet.addRow([]);

    // Table Headers
    const headers = ["Candidate Name", "Register Number", "Total Votes Received", "Percentage Share (%)", "Status"];
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;
    
    headerRow.eachCell((cell) => {
      cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } }; // #2563EB
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "double" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Populate Data Rows
    candidatesWithVotes.forEach((candidate, idx) => {
      const isCandidateWinner = totalVotes > 0 && candidate.voteCount === candidatesWithVotes[0].voteCount;
      const statusText = isCandidateWinner ? "Winner" : (totalVotes > 0 ? "Contested" : "No Votes");

      const row = worksheet.addRow([
        candidate.name,
        candidate.registerNumber,
        candidate.voteCount,
        `${candidate.percentage}%`,
        statusText,
      ]);

      row.height = 20;
      row.eachCell((cell, colNum) => {
        cell.font = { name: "Segoe UI", size: 10 };
        cell.alignment = { horizontal: colNum === 1 ? "left" : "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };

        // Alternate row colors
        if (idx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        }

        // Highlight winner
        if (colNum === 5 && isCandidateWinner) {
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF15803D" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
        }
      });
    });

    // Auto fit column widths
    worksheet.columns.forEach((col) => {
      let maxLen = 15;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : "";
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      col.width = Math.min(30, maxLen + 3);
    });

    // Set response headers to trigger file download
    const cleanFileName = election.title.replace(/[^a-zA-Z0-9]/g, "_");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${cleanFileName}_Result.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  });

  // ==========================================
  // REMAINING VOTERS REPORT API
  // ==========================================

  app.get("/api/reports/remaining-voters/:electionId", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    try {
      const { electionId } = req.params;
      const election = Elections.findById(electionId);
      if (!election) {
        res.status(404).json({ error: "Election not found" });
        return;
      }

      const electors = Electors.find();
      const votes = Votes.find({ electionId });
      const votedElectorIds = new Set(votes.map((v) => v.electorId));
      
      const remainingVoters = electors
        .filter((e) => !votedElectorIds.has(e.id))
        .map((e) => ({
          id: e.id,
          registerNumber: e.registerNumber,
          name: e.name,
        }));

      // Sort by register number
      remainingVoters.sort((a, b) => a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true, sensitivity: "base" }));

      const totalRegistered = electors.length;
      const totalVotesCast = votes.length;
      const remainingCount = remainingVoters.length;
      const votingPercentage = totalRegistered > 0 ? Math.round((totalVotesCast / totalRegistered) * 100) : 0;

      res.json({
        election: {
          id: election.id,
          title: election.title,
          description: election.description,
          status: election.status,
        },
        stats: {
          totalRegistered,
          totalVotesCast,
          remainingCount,
          votingPercentage,
        },
        remainingVoters,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate remaining voters report" });
    }
  });

  app.get("/api/reports/remaining-voters/:electionId/export", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { electionId } = req.params;
      const election = Elections.findById(electionId);
      if (!election) {
        res.status(404).json({ error: "Election not found" });
        return;
      }

      const electors = Electors.find();
      const votes = Votes.find({ electionId });
      const votedElectorIds = new Set(votes.map((v) => v.electorId));
      
      const remainingVoters = electors
        .filter((e) => !votedElectorIds.has(e.id))
        .map((e) => ({
          registerNumber: e.registerNumber,
          name: e.name,
        }));

      // Sort by register number
      remainingVoters.sort((a, b) => a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true, sensitivity: "base" }));

      const totalRegistered = electors.length;
      const totalVotesCast = votes.length;
      const remainingCount = remainingVoters.length;
      const votingPercentage = totalRegistered > 0 ? Math.round((totalVotesCast / totalRegistered) * 100) : 0;

      // Create Excel Workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Remaining Voters");

      // Styled Title
      worksheet.mergeCells("A1:C1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "ONLINE ELECTION VOTING SYSTEM";
      titleCell.font = { name: "Segoe UI", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }; // #0F172A
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(1).height = 40;

      // Subheader Info Block
      worksheet.mergeCells("A2:C2");
      const subCell = worksheet.getCell("A2");
      subCell.value = `Report: Remaining Voters (Those who have not yet voted)`;
      subCell.font = { name: "Segoe UI", size: 11, bold: true };
      subCell.alignment = { horizontal: "left" };

      worksheet.mergeCells("A3:C3");
      const electionTitleCell = worksheet.getCell("A3");
      electionTitleCell.value = `Election: ${election.title}`;
      electionTitleCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF2563EB" } };

      worksheet.mergeCells("A4:C4");
      const descCell = worksheet.getCell("A4");
      descCell.value = `Description: ${election.description}`;
      descCell.font = { name: "Segoe UI", size: 10, italic: true };

      worksheet.mergeCells("A5:C5");
      const dateCell = worksheet.getCell("A5");
      dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
      dateCell.font = { name: "Segoe UI", size: 9, color: { argb: "FF64748B" } };

      // Empty row spacer
      worksheet.addRow([]);

      // Summary Stats section headers
      worksheet.mergeCells("A7:C7");
      const statsHeaderCell = worksheet.getCell("A7");
      statsHeaderCell.value = "ELECTION SUMMARY STATISTICS";
      statsHeaderCell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF0F172A" } };
      statsHeaderCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; // Slate 100
      statsHeaderCell.alignment = { horizontal: "center" };
      worksheet.getRow(7).height = 24;

      const statRows = [
        ["Total Registered Voters", totalRegistered],
        ["Total Votes Cast", totalVotesCast],
        ["Remaining Voters (Pending)", remainingCount],
        ["Voting Turnout Percentage", `${votingPercentage}%`],
      ];

      statRows.forEach((statRow, idx) => {
        const rowNum = 8 + idx;
        worksheet.getRow(rowNum).height = 20;
        worksheet.getCell(`A${rowNum}`).value = statRow[0];
        worksheet.getCell(`A${rowNum}`).font = { name: "Segoe UI", size: 10, bold: true };
        worksheet.getCell(`B${rowNum}`).value = statRow[1];
        worksheet.getCell(`B${rowNum}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: idx === 2 ? "FFB45309" : "FF2563EB" } }; // Highlight remaining in amber
      });

      // Spacer row
      worksheet.addRow([]);

      // Table Headers
      const tableHeaderRow = worksheet.addRow(["Register Number", "Voter Name"]);
      tableHeaderRow.height = 25;
      
      tableHeaderRow.eachCell((cell) => {
        cell.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } }; // #2563EB
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "double" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Populate Data Rows
      remainingVoters.forEach((v, idx) => {
        const row = worksheet.addRow([v.registerNumber, v.name]);
        row.height = 20;
        row.eachCell((cell, colNum) => {
          cell.font = { name: "Segoe UI", size: 10 };
          cell.alignment = { horizontal: colNum === 1 ? "center" : "left", vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };

          // Alternate row colors
          if (idx % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
        });
      });

      // Auto fit column widths
      worksheet.columns.forEach((col) => {
        let maxLen = 15;
        col.eachCell?.({ includeEmpty: true }, (cell) => {
          const valStr = cell.value ? String(cell.value) : "";
          if (valStr.length > maxLen) {
            maxLen = valStr.length;
          }
        });
        col.width = Math.min(35, maxLen + 3);
      });

      // Set response headers to trigger file download
      const cleanFileName = election.title.replace(/[^a-zA-Z0-9]/g, "_");
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${cleanFileName}_Remaining_Voters.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate Excel export" });
    }
  });

  // ==========================================
  // VITE DEVELOPMENT MIDDLEWARE / PRODUCTION ASSET SERVING
  // ==========================================

  if (!process.env.VERCEL) {
    const bootServer = async () => {
      if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req: Request, res: Response) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }

      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Voting Server successfully booted on http://localhost:${PORT}`);
      });
    };

    bootServer().catch((err) => {
      console.error("Critical server startup failure:", err);
    });
  }

export default app;
