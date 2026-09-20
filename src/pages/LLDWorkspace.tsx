import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Group, Panel, Separator } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import {
  Play,
  RotateCcw,
  Save,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Terminal,
  Loader2,
  ChevronRight,
  Code2,
  Layers,
  FileCode,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { lldApi, type LLDProblem, type LLDExecuteResult } from '../api/client';

// Default fallback problem if database is empty or slug not found
const DEFAULT_PROBLEM: LLDProblem = {
  _id: 'default-parking-lot',
  title: 'Design a Parking Lot System',
  slug: 'design-a-parking-lot',
  description: `## Problem Overview
Design an object-oriented Low-Level Design (LLD) for an automated **Parking Lot Management System**.

### Requirements
1. **Vehicle Types**: Support multiple vehicle types: \`Motorcycle\`, \`Car\`, \`Truck\`, and \`Van\`.
2. **Parking Spots**:
   - Compact spots (for Motorcycles & Cars)
   - Large spots (for Trucks & Vans)
   - Handicapped spots
   - Electric Vehicle (EV) charging spots
3. **Multiple Floors**: The parking lot contains multiple levels/floors, each having a fixed number of spots.
4. **Ticket & Payment**:
   - Issue a ticket at the entrance with entrance timestamp and assigned spot.
   - Calculate parking fees at the exit gate based on vehicle type and duration.
   - Support multiple payment strategies (Cash, Credit Card, UPI/Online).
5. **Concurrency & Thread Safety**:
   - Multiple entry and exit gates must be able to assign and free spots concurrently without race conditions.

### Design Patterns to Apply
- **Factory Pattern**: For creating vehicles and parking spot types.
- **Strategy Pattern**: For calculating parking rates / fee calculation.
- **Singleton Pattern**: For the central Parking Lot Controller.
- **Observer Pattern**: To notify display boards on spot availability changes.
`,
  difficulty: 'medium',
  patternTags: ['Factory', 'Strategy', 'Singleton', 'Observer'],
  starterCode: {
    python: `from abc import ABC, abstractmethod
from enum import Enum
import time

class VehicleType(Enum):
    MOTORCYCLE = 1
    CAR = 2
    TRUCK = 3

class Vehicle(ABC):
    def __init__(self, license_plate: str, vehicle_type: VehicleType):
        self.license_plate = license_plate
        self.vehicle_type = vehicle_type

class Car(Vehicle):
    def __init__(self, license_plate: str):
        super().__init__(license_plate, VehicleType.CAR)

class ParkingSpot:
    def __init__(self, spot_id: str, spot_type: VehicleType):
        self.spot_id = spot_id
        self.spot_type = spot_type
        self.vehicle = None

    def is_available(self) -> bool:
        return self.vehicle is None

    def park(self, vehicle: Vehicle) -> bool:
        if self.is_available() and self.spot_type == vehicle.vehicle_type:
            self.vehicle = vehicle
            return True
        return False

    def unpark(self):
        self.vehicle = None

class ParkingLot:
    def __init__(self, name: str):
        self.name = name
        self.spots = []

    def add_spot(self, spot: ParkingSpot):
        self.spots.append(spot)

    def park_vehicle(self, vehicle: Vehicle) -> bool:
        for spot in self.spots:
            if spot.is_available() and spot.spot_type == vehicle.vehicle_type:
                return spot.park(vehicle)
        return False

# Test your design
if __name__ == "__main__":
    lot = ParkingLot("Downtown Tech Garage")
    lot.add_spot(ParkingSpot("C1", VehicleType.CAR))
    
    my_car = Car("KA-01-AB-1234")
    parked = lot.park_vehicle(my_car)
    print(f"Vehicle {my_car.license_plate} parked successfully: {parked}")
`,
    java: `import java.util.*;

enum VehicleType {
    MOTORCYCLE, CAR, TRUCK
}

abstract class Vehicle {
    protected String licensePlate;
    protected VehicleType type;

    public Vehicle(String licensePlate, VehicleType type) {
        this.licensePlate = licensePlate;
        this.type = type;
    }

    public VehicleType getType() { return type; }
    public String getLicensePlate() { return licensePlate; }
}

class Car extends Vehicle {
    public Car(String licensePlate) {
        super(licensePlate, VehicleType.CAR);
    }
}

class ParkingSpot {
    private String id;
    private VehicleType type;
    private Vehicle currentVehicle;

    public ParkingSpot(String id, VehicleType type) {
        this.id = id;
        this.type = type;
    }

    public boolean isAvailable() {
        return currentVehicle == null;
    }

    public boolean park(Vehicle v) {
        if (isAvailable() && v.getType() == this.type) {
            this.currentVehicle = v;
            return true;
        }
        return false;
    }
}

public class Solution {
    public static void main(String[] args) {
        ParkingSpot spot = new ParkingSpot("C-101", VehicleType.CAR);
        Car car = new Car("MH-12-DE-9999");
        System.out.println("Parking status: " + spot.park(car));
    }
}
`,
    cpp: `#include <iostream>
#include <string>
#include <vector>

enum class VehicleType { MOTORCYCLE, CAR, TRUCK };

class Vehicle {
protected:
    std::string licensePlate;
    VehicleType type;
public:
    Vehicle(std::string plate, VehicleType t) : licensePlate(plate), type(t) {}
    virtual ~Vehicle() = default;
    VehicleType getType() const { return type; }
    std::string getPlate() const { return licensePlate; }
};

class Car : public Vehicle {
public:
    Car(std::string plate) : Vehicle(plate, VehicleType.CAR) {}
};

int main() {
    Car car("KA-05-MB-4567");
    std::cout << "Created Car with Plate: " << car.getPlate() << std::endl;
    return 0;
}
`,
    javascript: `class VehicleType {
  static MOTORCYCLE = 'MOTORCYCLE';
  static CAR = 'CAR';
  static TRUCK = 'TRUCK';
}

class Vehicle {
  constructor(licensePlate, type) {
    this.licensePlate = licensePlate;
    this.type = type;
  }
}

class Car extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.CAR);
  }
}

class ParkingSpot {
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.vehicle = null;
  }

  isAvailable() {
    return this.vehicle === null;
  }

  park(vehicle) {
    if (this.isAvailable() && vehicle.type === this.type) {
      this.vehicle = vehicle;
      return true;
    }
    return false;
  }
}

const spot = new ParkingSpot('S1', VehicleType.CAR);
const car = new Car('KA-01-1234');
console.log('Vehicle parked:', spot.park(car));
`,
  },
  externalLinks: [
    { label: 'AlgoMaster: Design Parking Lot', url: 'https://algomaster.io/learn/lld' },
    { label: 'Refactoring Guru: Factory Pattern', url: 'https://refactoring.guru/design-patterns/factory-method' },
    { label: 'Refactoring Guru: Strategy Pattern', url: 'https://refactoring.guru/design-patterns/strategy' },
  ],
};

type LanguageKey = 'python' | 'java' | 'cpp' | 'javascript';

const LANGUAGE_CONFIG: Record<LanguageKey, { label: string; monacoLang: string; extension: string }> = {
  python: { label: 'Python 3', monacoLang: 'python', extension: '.py' },
  java: { label: 'Java 15', monacoLang: 'java', extension: '.java' },
  cpp: { label: 'C++ 20', monacoLang: 'cpp', extension: '.cpp' },
  javascript: { label: 'JavaScript (Node.js)', monacoLang: 'javascript', extension: '.js' },
};

export function LLDWorkspace() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  // Problem State
  const [problem, setProblem] = useState<LLDProblem>(DEFAULT_PROBLEM);
  const [loadingProblem, setLoadingProblem] = useState<boolean>(true);

  // Editor State
  const [language, setLanguage] = useState<LanguageKey>('python');
  const [code, setCode] = useState<string>(DEFAULT_PROBLEM.starterCode.python);
  const [dirty, setDirty] = useState<boolean>(false);

  // Execution & AI Review State
  const [running, setRunning] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<LLDExecuteResult | null>(null);
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'output' | 'review'>('output');

  // Autosave State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const lastSavedCodeRef = useRef<string>('');

  // 1. Fetch Problem by slug
  useEffect(() => {
    let active = true;
    const fetchProblem = async () => {
      setLoadingProblem(true);
      try {
        if (slug) {
          const data = await lldApi.getProblem(slug);
          if (active && data) {
            setProblem(data);
            const initialCode = data.starterCode?.[language] || DEFAULT_PROBLEM.starterCode[language];
            setCode(initialCode);
            lastSavedCodeRef.current = initialCode;
            setDirty(false);
          }
        } else {
          // If at root /lld or /lld/practice, check problems list or fallback to default
          const res = await lldApi.getProblems();
          if (active && res.problems && res.problems.length > 0) {
            const first = res.problems[0];
            setProblem(first);
            const initialCode = first.starterCode?.[language] || DEFAULT_PROBLEM.starterCode[language];
            setCode(initialCode);
            lastSavedCodeRef.current = initialCode;
          } else {
            setProblem(DEFAULT_PROBLEM);
            setCode(DEFAULT_PROBLEM.starterCode[language]);
            lastSavedCodeRef.current = DEFAULT_PROBLEM.starterCode[language];
          }
        }
      } catch (err) {
        console.warn('Failed to load problem from API, using default problem:', err);
        setProblem(DEFAULT_PROBLEM);
        setCode(DEFAULT_PROBLEM.starterCode[language]);
        lastSavedCodeRef.current = DEFAULT_PROBLEM.starterCode[language];
      } finally {
        if (active) setLoadingProblem(false);
      }
    };

    fetchProblem();
    return () => {
      active = false;
    };
  }, [slug]);

  // 2. Switch Language: switch starter template
  const handleLanguageChange = (newLang: LanguageKey) => {
    setLanguage(newLang);
    const starter = problem.starterCode?.[newLang] || DEFAULT_PROBLEM.starterCode[newLang];
    setCode(starter);
    setDirty(false);
    setSaveStatus('saved');
    lastSavedCodeRef.current = starter;
  };

  // 3. Reset Code to Starter Template
  const handleResetCode = () => {
    if (window.confirm('Reset code to initial starter template? Any unsaved edits will be discarded.')) {
      const starter = problem.starterCode?.[language] || DEFAULT_PROBLEM.starterCode[language];
      setCode(starter);
      setDirty(false);
      setSaveStatus('saved');
      lastSavedCodeRef.current = starter;
    }
  };

  // 4. Save Draft
  const handleSaveDraft = useCallback(
    async (isAutosave = false) => {
      if (!dirty && isAutosave) return;
      setSaveStatus('saving');
      try {
        if (problem._id && problem._id !== 'default-parking-lot') {
          await lldApi.saveSubmission({
            problemId: problem._id,
            language,
            code,
            status: 'draft',
          });
        }
        lastSavedCodeRef.current = code;
        setDirty(false);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Draft save failed:', err);
        setSaveStatus('unsaved');
      }
    },
    [code, dirty, language, problem._id]
  );

  // Autosave interval (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirty && code !== lastSavedCodeRef.current) {
        handleSaveDraft(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [code, dirty, handleSaveDraft]);

  // 5. Run Code (Proxies through /api/lld/execute to Piston)
  const handleRunCode = async () => {
    if (running) return;
    setRunning(true);
    setActiveTab('output');
    try {
      const result = await lldApi.executeCode({
        language,
        code,
      });
      setExecResult(result);
    } catch (err: any) {
      setExecResult({
        stdout: '',
        stderr: err.message || 'Execution error occurred',
        exitCode: 1,
        output: err.message || 'Execution failed',
        runtime: 0,
      });
    } finally {
      setRunning(false);
    }
  };

  // 6. Submit Code (Saves submission, marks submitted, generates AI review)
  const handleSubmitCode = async () => {
    if (submitting) return;
    setSubmitting(true);
    setActiveTab('review');
    setReviewing(true);

    try {
      // 1. Save submission
      let submissionId: string | undefined;
      if (problem._id && problem._id !== 'default-parking-lot') {
        const sub = await lldApi.saveSubmission({
          problemId: problem._id,
          language,
          code,
          status: 'submitted',
        });
        submissionId = sub._id;

        // 2. Update progress
        await lldApi.updateProgress({
          completedProblemId: problem._id,
        }).catch(err => console.warn('Progress update failed:', err));
      }

      // 3. Request AI Design Review
      const reviewRes = await lldApi.getAiReview({
        problemTitle: problem.title,
        problemDescription: problem.description,
        language,
        code,
        submissionId,
      });

      setAiReview(reviewRes.review);
      setSaveStatus('saved');
      setDirty(false);
    } catch (err: any) {
      setAiReview(`### Review Generation Failed\n\n${err.message || 'Unable to generate AI review at this time.'}`);
    } finally {
      setSubmitting(false);
      setReviewing(false);
    }
  };

  // Difficulty badge colors
  const difficultyBadgeStyle = {
    easy: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: 'rgba(16, 185, 129, 0.3)' },
    medium: { bg: 'rgba(245, 158, 11, 0.12)', color: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' },
    hard: { bg: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: 'rgba(239, 68, 68, 0.3)' },
  }[problem.difficulty] || { bg: 'rgba(245, 158, 11, 0.12)', color: '#FBBF24', border: 'rgba(245, 158, 11, 0.3)' };

  return (
    <div style={styles.workspaceRoot}>
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <button onClick={() => navigate('/lld')} style={styles.backBtn} title="Back to LLD Track">
            <Layers size={14} />
            <span>LLD Track</span>
          </button>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={styles.problemHeading}>{problem.title}</span>
          <span
            style={{
              ...styles.difficultyBadge,
              backgroundColor: difficultyBadgeStyle.bg,
              color: difficultyBadgeStyle.color,
              borderColor: difficultyBadgeStyle.border,
            }}
          >
            {problem.difficulty.toUpperCase()}
          </span>
        </div>

        {/* Action Controls */}
        <div style={styles.topBarRight}>
          {/* Language Selector */}
          <div style={styles.langSelectorWrap}>
            <FileCode size={13} color="var(--accent-bright)" />
            <select
              value={language}
              onChange={e => handleLanguageChange(e.target.value as LanguageKey)}
              style={styles.langSelect}
            >
              {(Object.keys(LANGUAGE_CONFIG) as LanguageKey[]).map(key => (
                <option key={key} value={key} style={{ background: 'var(--panel-bg)', color: 'var(--text)' }}>
                  {LANGUAGE_CONFIG[key].label}
                </option>
              ))}
            </select>
          </div>

          {/* Autosave status */}
          <div style={styles.autosaveIndicator}>
            {saveStatus === 'saving' ? (
              <>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} color="var(--text-muted)" />
                <span>Saving…</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <CheckCircle2 size={12} color="#10B981" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Clock size={12} color="#F59E0B" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>

          {/* Reset Starter Code */}
          <button onClick={handleResetCode} style={styles.iconActionBtn} title="Reset to starter code">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* Save Draft */}
          <button onClick={() => handleSaveDraft(false)} style={styles.iconActionBtn} title="Save current draft">
            <Save size={13} />
            <span>Save Draft</span>
          </button>

          <div style={styles.divider} />

          {/* Run Code Button */}
          <button
            id="btn-lld-run"
            onClick={handleRunCode}
            disabled={running}
            style={{
              ...styles.runBtn,
              opacity: running ? 0.7 : 1,
            }}
          >
            {running ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={13} />}
            <span>Run Code</span>
          </button>

          {/* Submit & AI Review Button */}
          <button
            id="btn-lld-submit"
            onClick={handleSubmitCode}
            disabled={submitting}
            style={{
              ...styles.submitBtn,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
            <span>Submit & Review</span>
          </button>
        </div>
      </div>

      {/* ── 3-Pane Resizable Layout ────────────────────────────────────────── */}
      <div style={styles.panelsContainer}>
        <Group orientation="horizontal" style={styles.panelsContainer}>
          {/* 1. Left Pane: Problem Description */}
          <Panel defaultSize={30} minSize={20} style={styles.pane}>
            <div style={styles.descriptionPane}>
              <div style={styles.paneHeader}>
                <div style={styles.paneTitle}>
                  <Code2 size={15} color="var(--accent-bright)" />
                  <span>Problem Statement</span>
                </div>
              </div>

              <div style={styles.descriptionContent}>
                {loadingProblem ? (
                  <div style={styles.loadingCenter}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="var(--accent-bright)" />
                    <span>Loading problem…</span>
                  </div>
                ) : (
                  <>
                    {/* Pattern Tags */}
                    {problem.patternTags && problem.patternTags.length > 0 && (
                      <div style={styles.tagsRow}>
                        {problem.patternTags.map(tag => (
                          <span key={tag} style={styles.patternTag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Markdown Body */}
                    <div style={styles.markdownWrapper}>
                      <ReactMarkdown>{problem.description}</ReactMarkdown>
                    </div>

                    {/* Reference Links */}
                    {problem.externalLinks && problem.externalLinks.length > 0 && (
                      <div style={styles.linksSection}>
                        <div style={styles.linksHeader}>Reference & Practice Links</div>
                        <div style={styles.linksList}>
                          {problem.externalLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.externalLink}
                            >
                              <span>{link.label}</span>
                              <ExternalLink size={12} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Panel>

          <Separator style={styles.resizeHandle} />

          {/* 2. Center Pane: Monaco Editor */}
          <Panel defaultSize={45} minSize={25} style={styles.pane}>
            <div style={styles.editorPane}>
              <div style={styles.paneHeader}>
                <div style={styles.paneTitle}>
                  <Terminal size={15} color="#06B6D4" />
                  <span>{LANGUAGE_CONFIG[language].label} Editor</span>
                </div>
                <span style={styles.filenameTag}>
                  Solution{LANGUAGE_CONFIG[language].extension}
                </span>
              </div>

              <div style={styles.editorWrapper}>
                <Editor
                  height="100%"
                  language={LANGUAGE_CONFIG[language].monacoLang}
                  theme={resolvedTheme === 'light' ? 'light' : 'vs-dark'}
                  value={code}
                  onChange={(val) => {
                    setCode(val || '');
                    setDirty(true);
                    setSaveStatus('unsaved');
                  }}
                  options={{
                    fontSize: 13,
                    fontFamily: "'IBM Plex Mono', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
            </div>
          </Panel>

          <Separator style={styles.resizeHandle} />

          {/* 3. Right Pane: Tabbed Console (Output & AI Review) */}
          <Panel defaultSize={25} minSize={18} style={styles.pane}>
            <div style={styles.consolePane}>
              {/* Console Tabs */}
              <div style={styles.consoleTabsHeader}>
                <button
                  onClick={() => setActiveTab('output')}
                  style={{
                    ...styles.consoleTab,
                    ...(activeTab === 'output' ? styles.consoleTabActive : {}),
                  }}
                >
                  <Terminal size={13} />
                  <span>Output</span>
                  {execResult && (
                    <span
                      style={{
                        ...styles.statusDot,
                        background: execResult.exitCode === 0 ? '#10B981' : '#EF4444',
                      }}
                    />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('review')}
                  style={{
                    ...styles.consoleTab,
                    ...(activeTab === 'review' ? styles.consoleTabActive : {}),
                  }}
                >
                  <Sparkles size={13} color="#A78BFA" />
                  <span>AI Design Review</span>
                  {aiReview && <span style={{ ...styles.statusDot, background: '#8B5CF6' }} />}
                </button>
              </div>

              {/* Console Body */}
              <div style={styles.consoleBody}>
                {activeTab === 'output' ? (
                  <div style={styles.outputView}>
                    {running ? (
                      <div style={styles.consoleEmptyState}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#06B6D4" />
                        <span>Executing code in secure sandbox…</span>
                      </div>
                    ) : execResult ? (
                      <div>
                        {/* Execution Summary Header */}
                        <div style={styles.execMetaBar}>
                          <div style={styles.execMetaItem}>
                            <span>Status:</span>
                            <span
                              style={{
                                color: execResult.exitCode === 0 ? '#10B981' : '#EF4444',
                                fontWeight: 600,
                              }}
                            >
                              {execResult.exitCode === 0 ? 'Success' : `Exit Code: ${execResult.exitCode}`}
                            </span>
                          </div>
                          <div style={styles.execMetaItem}>
                            <span>Runtime:</span>
                            <span style={{ color: 'var(--text)' }}>{execResult.runtime} ms</span>
                          </div>
                        </div>

                        {/* Stdout */}
                        {execResult.stdout && (
                          <div style={styles.outputBlock}>
                            <div style={styles.outputLabel}>STDOUT</div>
                            <pre style={styles.stdoutPre}>{execResult.stdout}</pre>
                          </div>
                        )}

                        {/* Stderr */}
                        {execResult.stderr && (
                          <div style={styles.outputBlock}>
                            <div style={{ ...styles.outputLabel, color: '#EF4444' }}>STDERR / ERRORS</div>
                            <pre style={styles.stderrPre}>{execResult.stderr}</pre>
                          </div>
                        )}

                        {!execResult.stdout && !execResult.stderr && (
                          <div style={styles.emptyOutputNotice}>Program exited cleanly with no output.</div>
                        )}
                      </div>
                    ) : (
                      <div style={styles.consoleEmptyState}>
                        <Terminal size={32} color="var(--border)" />
                        <span style={{ marginTop: 12 }}>Run your code to see the output here.</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Code is executed remotely via sandboxed container.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.reviewView}>
                    {reviewing ? (
                      <div style={styles.consoleEmptyState}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#A78BFA" />
                        <span>AI Senior Architect is reviewing your Low-Level Design…</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Analyzing SOLID adherence, design patterns, modularity, and clean code.
                        </span>
                      </div>
                    ) : aiReview ? (
                      <div style={styles.reviewContent}>
                        <ReactMarkdown>{aiReview}</ReactMarkdown>
                      </div>
                    ) : (
                      <div style={styles.consoleEmptyState}>
                        <Sparkles size={32} color="var(--border)" />
                        <span style={{ marginTop: 12 }}>No review generated yet.</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          Click "Submit & Review" to evaluate your class design with AI.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  workspaceRoot: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--bg)',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },
  topBar: {
    height: '46px',
    backgroundColor: 'var(--sidebar-bg)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
    zIndex: 10,
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-dim)',
    fontSize: '12.5px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },
  problemHeading: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text)',
    letterSpacing: '-0.01em',
  },
  difficultyBadge: {
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: "'IBM Plex Mono', monospace",
    letterSpacing: '0.06em',
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1px solid',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  langSelectorWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '2px 8px',
  },
  langSelect: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text)',
    fontSize: '12px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  },
  autosaveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontFamily: "'IBM Plex Mono', monospace",
    marginRight: '6px',
  },
  iconActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '6px',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-dim)',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  divider: {
    width: '1px',
    height: '20px',
    background: 'var(--border)',
    margin: '0 4px',
  },
  runBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '30px',
    padding: '0 14px',
    borderRadius: '6px',
    background: 'rgba(6, 182, 212, 0.12)',
    border: '1px solid rgba(6, 182, 212, 0.4)',
    color: '#67E8F9',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '30px',
    padding: '0 14px',
    borderRadius: '6px',
    background: 'var(--accent)',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 0 12px var(--accent-glow)',
    transition: 'all 0.15s ease',
  },
  panelsContainer: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
  },
  pane: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  resizeHandle: {
    width: '4px',
    cursor: 'col-resize',
    backgroundColor: 'var(--border)',
    transition: 'background-color 0.15s ease',
  },
  paneHeader: {
    height: '36px',
    backgroundColor: 'var(--sidebar-bg)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    flexShrink: 0,
  },
  paneTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text)',
    fontFamily: "'DM Sans', sans-serif",
  },
  filenameTag: {
    fontSize: '11px',
    fontFamily: "'IBM Plex Mono', monospace",
    color: 'var(--text-muted)',
  },
  descriptionPane: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg)',
    borderRight: '1px solid var(--border)',
  },
  descriptionContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px 20px',
  },
  loadingCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '12px',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
  },
  patternTag: {
    fontSize: '10.5px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    color: '#C4B5FD',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    border: '1px solid rgba(124, 58, 237, 0.3)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  markdownWrapper: {
    color: 'var(--text)',
    fontSize: '13.5px',
    lineHeight: 1.65,
  },
  linksSection: {
    marginTop: '28px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border)',
  },
  linksHeader: {
    fontSize: '11px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '10px',
  },
  linksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  externalLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--accent-bright)',
    fontSize: '12.5px',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  },
  editorPane: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg)',
  },
  editorWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  consolePane: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--panel-bg)',
    borderLeft: '1px solid var(--border)',
  },
  consoleTabsHeader: {
    height: '36px',
    backgroundColor: 'var(--sidebar-bg)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'stretch',
    padding: '0 8px',
    flexShrink: 0,
  },
  consoleTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 12px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-dim)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  consoleTabActive: {
    color: 'var(--text)',
    borderBottomColor: 'var(--accent)',
    fontWeight: 600,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    marginLeft: '2px',
  },
  consoleBody: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: 'var(--bg)',
  },
  outputView: {
    padding: '14px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '12px',
  },
  execMetaBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-dim)',
    fontSize: '11px',
  },
  execMetaItem: {
    display: 'flex',
    gap: '6px',
    color: 'var(--text-muted)',
  },
  outputBlock: {
    marginBottom: '14px',
  },
  outputLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    marginBottom: '4px',
  },
  stdoutPre: {
    margin: 0,
    padding: '10px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.5,
  },
  stderrPre: {
    margin: 0,
    padding: '10px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#FCA5A5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.5,
  },
  emptyOutputNotice: {
    padding: '16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  reviewView: {
    padding: '16px',
    fontSize: '13px',
    lineHeight: 1.6,
    color: 'var(--text)',
  },
  reviewContent: {
    overflowY: 'auto',
  },
  consoleEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '240px',
    textAlign: 'center',
    color: 'var(--text-dim)',
    fontSize: '12.5px',
    padding: '20px',
  },
};
