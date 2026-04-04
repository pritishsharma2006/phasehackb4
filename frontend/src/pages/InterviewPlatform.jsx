import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const BOILERPLATES = {
    python: "def solve():\n    pass\n",
    cpp: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};",
    java: "import java.util.*;\n\nclass Solution {\n    public void solve() {\n        \n    }\n}",
    javascript: "function solve() {\n    \n}"
};

function InterviewPlatform() {
    const [session, setSession] = useState(null);
    const sessionRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState([]);
    const messagesRef = useRef([]);
    const [showEditor, setShowEditor] = useState(false);
    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState(BOILERPLATES["python"]);
    const codeRef = useRef(code);
    const idleTimerRef = useRef(null);
    const activeObserverRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const lastSentCodeRef = useRef(code);
    const [questionData, setQuestionData] = useState(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isInitializing, setIsInitializing] = useState(false);
    const speechBufferRef = useRef("");
    const speechTimeoutRef = useRef(null);

    // Phase 3 Analytics States
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [interviewReport, setInterviewReport] = useState(null);
    const [interviewScore, setInterviewScore] = useState(null);

    // Dynamic Configuration Settings
    const [candidateName, setCandidateName] = useState("");
    const [company, setCompany] = useState("Google");
    const [mode, setMode] = useState("Full-Fledged");
    const [resume, setResume] = useState("Software Engineer with CPP and React experience.");

    const videoRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize Webcam & Ambient Speech Recognition Loop
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => console.error("Error accessing media devices.", err));

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;  // The mic stays awake indefinitely
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsRecording(true);
            };

            recognition.onresult = (event) => {
                // Interruption Engine: Instantly silence the AI if candidate talks!
                window.speechSynthesis.cancel();

                // Piece together the latest block of speech
                let transcriptBlock = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    transcriptBlock += event.results[i][0].transcript;
                }

                // Prevent ghost audio feedback loop or tiny throat clears triggering the LLM natively
                if (transcriptBlock.trim().length > 3) {
                    console.log("Transcribed speech chunk:", transcriptBlock);

                    // Accumulate phrasing into the buffer to allow human breathing pauses
                    speechBufferRef.current += " " + transcriptBlock.trim();

                    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

                    // Wait 1.8 seconds of complete silence before assuming the candidate finished their sentence
                    speechTimeoutRef.current = setTimeout(() => {
                        const finalTranscript = speechBufferRef.current.trim();
                        if (finalTranscript.length > 0) {
                            console.log("Final Sent Speech:", finalTranscript);
                            sendSpeechToBackend(finalTranscript);
                        }
                        // Reset buffer for the next question
                        speechBufferRef.current = "";
                    }, 1800);
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
            };

            recognition.onend = () => {
                setIsRecording(false);
                // The Magic Loop: If the session is alive, force the mic back awake
                if (sessionRef.current) {
                    try { recognition.start(); } catch (e) { }
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("SpeechRecognition API not supported in this browser.");
        }

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (activeObserverRef.current) clearInterval(activeObserverRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        }
    }, []);

    // Shadow Observer Hook: Polls every 30s to simulate an AI looking over their shoulder
    useEffect(() => {
        if (session && showEditor) {
            activeObserverRef.current = setInterval(() => {
                if (codeRef.current && codeRef.current !== lastSentCodeRef.current) {
                    lastSentCodeRef.current = codeRef.current;
                    sendSpeechToBackend("[BACKGROUND_CODE_CHECK]", true);
                }
            }, 30000);
        } else {
            if (activeObserverRef.current) clearInterval(activeObserverRef.current);
        }

        return () => {
            if (activeObserverRef.current) clearInterval(activeObserverRef.current);
        }
    }, [session, showEditor]);

    const handleEditorChange = (value) => {
        setCode(value);
        codeRef.current = value;

        // Do not trigger the stuck loop if they literally haven't changed the default string yet
        const isDefault = Object.values(BOILERPLATES).some(b => value.trim() === b.trim());
        if (isDefault) return;

        // Stuck Detector: If 25 seconds pass silently, ping the LLM to intervene proactively
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
            if (sessionRef.current) {
                const pingMsg = "[CANDIDATE IS SILENT/STUCK: The candidate stopped coding and speaking for 25 seconds. Briefly check in to offer a subtle hint.]";
                sendSpeechToBackend(pingMsg, true); // True marks it as hidden
            }
        }, 25000);
    };

    const handleStartInterview = async () => {
        if (isInitializing) return; // Prevent double clicks
        setIsInitializing(true);

        try {
            const res = await fetch("http://localhost:8000/api/interview/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidate_name: candidateName.trim() || "Candidate",
                    resume_text: resume,
                    target_company: company,
                    mode: mode
                })
            });
            const data = await res.json();

            if (data.error) {
                alert(`Failed to start: ${data.error}`);
                return;
            }

            setSession(data.session_id);
            sessionRef.current = data.session_id;

            if (data.question_data) {
                setQuestionData(data.question_data);
            }

            // Start elapsed timer
            setTimeElapsed(0);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);

            // Boot Ambient mic loop
            if (recognitionRef.current) {
                try { recognitionRef.current.start(); } catch (e) { }
            }

            const newHistory = [{ role: "model", content: data.message }];
            setMessages(newHistory);
            messagesRef.current = newHistory;

            if (data.message && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(data.message);
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            console.error(err);
            alert(`Failed to start: Network Initialization Error`);
        } finally {
            setIsInitializing(false);
        }
    };

    const sendSpeechToBackend = async (transcript, isHidden = false) => {
        const currentSession = sessionRef.current;
        if (!currentSession) return;

        // Clear the idle stuck timer if they natively spoke to us!
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

        // Optimistically update history with candidate's true response
        if (!isHidden) {
            const newMessages = [...messagesRef.current, { role: "candidate", content: transcript }];
            setMessages(newMessages);
            messagesRef.current = newMessages;
        }

        const formData = new FormData();
        formData.append("session_id", currentSession);
        formData.append("candidate_name", candidateName.trim() || "Candidate");
        formData.append("resume_text", resume);
        formData.append("target_company", company);
        formData.append("mode", mode);
        formData.append("history", JSON.stringify(messagesRef.current));
        formData.append("user_text", transcript);

        if (questionData) {
            formData.append("question_title", questionData.title || "");
            formData.append("question_difficulty", questionData.difficulty || "");
        }

        // Provide the active code safely to Gemini's prompt space if the editor is out
        if (showEditor) {
            formData.append("current_code", codeRef.current);
        }

        try {
            const res = await fetch("http://localhost:8000/api/interview/reply", {
                method: "POST",
                body: formData
            });
            if (!res.ok) throw new Error("Backend error");
            const data = await res.json();

            const finalHistory = [...messagesRef.current, { role: "model", content: data.reply }];
            setMessages(finalHistory);
            messagesRef.current = finalHistory;

            // Trigger animated editor expansion
            if (data.is_coding_round) {
                setShowEditor(true);
            }

            // Shadow Observer Check: Completely discard [SILENT] payloads from UI and Audio!
            if (data.reply && data.reply.includes("[SILENT]")) {
                return;
            }

            if (data.reply && window.speechSynthesis) {
                window.speechSynthesis.cancel(); // Abort previous to ensure fresh playback
                // Strip markdown artifacts before speaking aloud
                const cleanReply = data.reply.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s?/g, '').replace(/_/g, '');
                const utterance = new SpeechSynthesisUtterance(cleanReply);
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const endInterview = async () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        setIsGeneratingReport(true);

        const formData = new FormData();
        formData.append("session_id", sessionRef.current);
        formData.append("history", JSON.stringify(messagesRef.current));
        formData.append("mode", mode);
        formData.append("target_company", company);
        if (questionData) {
            formData.append("question_title", questionData.title || "");
        }

        try {
            const res = await fetch("http://localhost:8000/api/interview/end", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            setInterviewReport(data.detailed_report);
            if (data.score !== null && data.score !== undefined) {
                setInterviewScore(data.score);
            }
        } catch (err) {
            console.error("Failed to generate report:", err);
            setInterviewReport("Critical Error: Evaluation failed to generate.");
        } finally {
            setIsGeneratingReport(false);
            setSession(null);
            sessionRef.current = null;
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (isGeneratingReport) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', color: '#1a1a1a', marginTop: '100px' }}>
                <h1 style={{ color: '#81A6C6', fontFamily: "'Playfair Display', serif" }}>Evaluating Candidate Performance...</h1>
                <p style={{ fontSize: '18px', color: '#576574' }}>The Hiring Committee is currently reviewing your transcript and coding structures.</p>
                <div style={{ marginTop: '30px', fontStyle: 'italic', color: '#9ba3af' }}>This may take 10-15 seconds depending on interview length.</div>
            </div>
        );
    }

    if (interviewReport) {
        const scoreColor = interviewScore >= 80 ? '#4caf50' : interviewScore >= 60 ? '#ff9800' : interviewScore >= 40 ? '#ff5722' : '#f44336';
        const scoreLabel = interviewScore >= 80 ? 'Exceptional' : interviewScore >= 60 ? 'Strong' : interviewScore >= 40 ? 'Average' : 'Needs Work';
        const circumference = 2 * Math.PI * 54;
        const strokeDashoffset = circumference - (circumference * (interviewScore || 0)) / 100;

        return (
            <div className="section-card" style={{ padding: '40px', maxWidth: '1000px', margin: '40px auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #D2C4B4', paddingBottom: '20px', marginBottom: '30px' }}>
                    <h1 style={{ margin: 0, color: '#1a1a1a', fontFamily: "'Playfair Display', serif" }}>{company} - Final Evaluation Report</h1>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={() => window.print()} className="button button-outline">📄 Save as PDF</button>
                        <button onClick={() => window.location.reload()} className="button button-danger">Close Dashboard</button>
                    </div>
                </div>

                {interviewScore !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px', padding: '25px', backgroundColor: '#fdfaf5', borderRadius: '12px', marginBottom: '30px', border: `1.5px solid ${scoreColor}` }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="#D2C4B4" strokeWidth="8" />
                                <circle 
                                    cx="60" cy="60" r="54" fill="none" 
                                    stroke={scoreColor} strokeWidth="8" 
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    transform="rotate(-90 60 60)"
                                    style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: scoreColor }}>{interviewScore}</div>
                                <div style={{ fontSize: '11px', color: '#576574' }}>/100</div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: scoreColor, marginBottom: '5px' }}>{scoreLabel}</div>
                            <div style={{ fontSize: '14px', color: '#576574', lineHeight: '1.5' }}>
                                Problem Solving (30) • Code Quality (30) • Communication (20) • Optimization (20)
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ lineHeight: '1.8', fontSize: '16px', whiteSpace: 'pre-wrap', color: '#2D3436' }}>
                    {interviewReport.replace(/\*\*/g, '').replace(/\*/g, '•')}
                </div>
            </div>
        );
    }

    return (
        <div className="page-card" style={{ maxWidth: showEditor ? '1400px' : '900px', margin: 'auto', transition: 'max-width 0.5s ease', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', fontFamily: "'Playfair Display', serif", color: '#1a1a1a', margin: 0 }}>
                    {session ? `${company} - ${mode}` : 'AI Interview Platform'}
                    {session && (
                        <span style={{ fontSize: '18px', color: '#d97706', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '8px', fontWeight: '500' }}>
                            ⏱️ {formatTime(timeElapsed)}
                        </span>
                    )}
                </h1>
                {session && (
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span style={{ padding: '6px 16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '999px', color: '#059669', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {isRecording ? "Listening Ambiently..." : "Ambient Mic Parsing..."}
                        </span>
                        <button onClick={endInterview} className="button button-danger">Leave Call</button>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>

                {/* Left pane: Media & Communication */}
                <div style={{ flex: showEditor ? '0 0 450px' : '1', transition: 'flex 0.5s ease', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        style={{ width: '100%', borderRadius: '12px', border: '1.5px solid #D2C4B4', backgroundColor: '#1a1a1a', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                    />

                    {!session && (
                        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.4rem' }}>Interview Parameters</h3>

                            <div>
                                <label>Your Name</label>
                                <input
                                    value={candidateName}
                                    onChange={e => setCandidateName(e.target.value)}
                                    placeholder="What should the AI call you?"
                                />
                            </div>

                            <div>
                                <label>Target Company</label>
                                <input
                                    list="company-list"
                                    value={company}
                                    onChange={e => setCompany(e.target.value)}
                                    placeholder="Search or type company... e.g. Amazon"
                                />
                                <datalist id="company-list">
                                    <option value="Google" />
                                    <option value="Amazon" />
                                    <option value="Facebook" />
                                    <option value="Apple" />
                                    <option value="Microsoft" />
                                    <option value="Uber" />
                                    <option value="Netflix" />
                                    <option value="Databricks" />
                                    <option value="Snowflake" />
                                    <option value="Stripe" />
                                    <option value="Airbnb" />
                                    <option value="Goldman Sachs" />
                                    <option value="Palantir" />
                                    <option value="Nvidia" />
                                    <option value="Tesla" />
                                </datalist>
                            </div>

                            <div>
                                <label>Interview Mode</label>
                                <select
                                    value={mode}
                                    onChange={e => setMode(e.target.value)}
                                >
                                    <option>Full-Fledged</option>
                                    <option>Behavioral</option>
                                    <option>DSA Round</option>
                                    <option>System Design</option>
                                </select>
                            </div>

                            <div>
                                <label>Candidate Resume (Context)</label>
                                <textarea
                                    value={resume}
                                    onChange={e => setResume(e.target.value)}
                                    style={{ minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>

                            <button
                                onClick={handleStartInterview}
                                disabled={isInitializing}
                                className="button"
                                style={{ marginTop: '10px', opacity: isInitializing ? 0.6 : 1 }}
                            >
                                {isInitializing ? "Configuring Agent..." : "Initialize Interview Session"}
                            </button>
                        </div>
                    )}

                    {session && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ border: '1.5px solid #D2C4B4', borderRadius: '12px', padding: '20px', height: '350px', overflowY: 'auto', backgroundColor: '#fdfaf5', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                                {messages.map((msg, idx) => (
                                    <div key={idx} style={{ marginBottom: '16px', color: msg.role === 'candidate' ? '#576574' : '#1a1a1a', fontWeight: msg.role === 'candidate' ? 'normal' : '500', lineHeight: '1.5' }}>
                                        <strong style={{ color: msg.role === 'candidate' ? '#81A6C6' : '#1a1a1a' }}>{msg.role === 'candidate' ? 'You' : 'Interviewer'}:</strong> {msg.content}
                                    </div>
                                ))}
                            </div>
                            <input 
                                type="text"
                                placeholder="Mic not catching you? Type your response here and press Enter..."
                                style={{ padding: '14px' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        sendSpeechToBackend(e.target.value.trim());
                                        e.target.value = '';
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Right pane: Dynamic Monaco Display */}
                <div style={{ 
                    flex: showEditor ? '1' : '0', 
                    width: showEditor ? 'auto' : '0px', 
                    opacity: showEditor ? 1 : 0, 
                    overflow: 'hidden', 
                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)', 
                    display: 'flex', 
                    flexDirection: 'column' 
                }}>
                    <div style={{ 
                        borderRadius: '12px', 
                        border: '1.5px solid #D2C4B4', 
                        height: '800px', 
                        backgroundColor: '#1E1E1E', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        overflow: 'hidden', 
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)' 
                    }}>
                        <div style={{ padding: '12px 20px', backgroundColor: '#fdfaf5', borderBottom: '1.5px solid #D2C4B4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#1a1a1a', fontWeight: 'bold' }}>Code Editor</span>
                            <select 
                                value={language} 
                                onChange={(e) => {
                                    const newLang = e.target.value;
                                    const newBoilerplate = BOILERPLATES[newLang];
                                    const isDefault = Object.values(BOILERPLATES).some(b => code.trim() === b.trim());
                                    
                                    if (!isDefault) {
                                        if (!window.confirm("Changing language will reset your code to the default boilerplate. Proceed?")) return;
                                    }
                                    
                                    setLanguage(newLang);
                                    setCode(newBoilerplate);
                                    codeRef.current = newBoilerplate;
                                }}
                                style={{ width: 'auto', padding: '6px 12px', borderRadius: '999px', fontSize: '0.9rem' }}
                            >
                                <option value="python">Python 3</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                                <option value="javascript">JavaScript</option>
                            </select>
                        </div>
                        {showEditor && (
                            <Editor
                                height="100%"
                                theme="vs-dark"
                                language={language}
                                value={code}
                                onChange={handleEditorChange}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 16,
                                    wordWrap: "on",
                                    scrollBeyondLastLine: false,
                                    padding: { top: 20 }
                                }}
                            />
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default InterviewPlatform;
