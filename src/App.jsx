import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, CheckSquare, ArrowRight, RotateCcw, Send, Terminal, BarChart2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- 1단계에서 복사한 내 설정을 여기에 붙여넣으세요 ---
const firebaseConfig = {
  apiKey: "AIzaSyBTQniqZqVhmWstvSLc3BfgpcL1cwmrCHQ",
  authDomain: "mbti-test-28f5c.firebaseapp.com",
  projectId: "mbti-test-28f5c",
  storageBucket: "mbti-test-28f5c.firebasestorage.app",
  messagingSenderId: "987516872468",
  appId: "1:987516872468:web:ef641ecd7ccf2760500401",
  measurementId: "G-24M9XK3V1X"
};

// ----------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 스타일 및 질문 데이터 (기존 코드와 동일, 분량상 생략된 부분은 위에서 복사해오세요)
// ... (STYLES, QUESTIONS 배열은 위에서 작성해드린 코드 그대로 사용하세요) ...

// --- 디자인 시스템: 뉴브루탈리즘 스타일 클래스 ---
const STYLES = {
  container: "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none p-6",
  button: "w-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all font-bold py-4 px-6 text-left flex justify-between items-center",
  primaryButton: "bg-[#FFD700] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFC700] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all font-black text-lg py-4 px-8",
  chatBubbleBot: "bg-[#FFD700] border-2 border-black text-black p-4 max-w-[80%] self-start shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 font-medium",
  chatBubbleUser: "bg-white border-2 border-black text-black p-4 max-w-[80%] self-end shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 font-medium text-right",
  progressBarBg: "w-full h-6 border-2 border-black bg-white mt-4",
  progressBarFill: "h-full bg-[#007BFF] border-r-2 border-black transition-all duration-300"
};

// --- 데이터: MBTI 4지표 (E/I, S/N, T/F, J/P) 20문항 ---
const QUESTIONS = [
  // ... (여기에 아까 작성해드린 QUESTIONS 배열 전체를 복사해서 넣으세요) ...
  // (코드 길이가 길어서 생략했습니다. 위쪽 답변의 QUESTIONS 배열을 그대로 쓰시면 됩니다)
    // E vs I (에너지 방향)
  { type: 'EI', text: "주말에 갑작스러운 번개 모임 제안이 왔다.", chat: "야ㅋㅋ 지금 강남인데 나와! 애들 다 모임", 
    optA: { text: "오! 재밌겠다 바로 나감", type: 'E' }, optB: { text: "아.. 나 오늘 쉴래 (기빨림)", type: 'I' } },
  { type: 'EI', text: "파티에서 낯선 사람이 말을 걸었다.", chat: "혹시 여기 자리 있어요? 저랑 같이 합석하실래요?", 
    optA: { text: "네! (자연스럽게 대화 시작)", type: 'E' }, optB: { text: "아.. 네.. (어색, 도망가고 싶음)", type: 'I' } },
  { type: 'EI', text: "스트레스를 받았을 때 나는?", chat: "오늘 진짜 개힘들었다... 뭐하냐?", 
    optA: { text: "친구 만나서 수다 떨며 푼다", type: 'E' }, optB: { text: "혼자 방에서 넷플릭스 보며 쉰다", type: 'I' } },
  { type: 'EI', text: "엘리베이터에 직장 동료와 단둘이 탔다.", chat: "(정적...)", 
    optA: { text: "어제 축구 보셨어요? (스몰토크 시도)", type: 'E' }, optB: { text: "(폰 보는 척 함)", type: 'I' } },
  { type: 'EI', text: "친구들과 놀고 집에 들어왔을 때 느낌은?", chat: "오늘 진짜 재밌었지? ㅋㅋ 집 도착함?", 
    optA: { text: "완전 꿀잼! 더 놀 수 있었는데 아쉽", type: 'E' }, optB: { text: "재밌긴 했는데 기 다 빨림.. 눕고 싶다", type: 'I' } },

  // S vs N (인식 기능)
  { type: 'SN', text: "멍 때릴 때 주로 하는 생각은?", chat: "너 무슨 생각 해? 멍 때리네", 
    optA: { text: "오늘 저녁 뭐 먹지? (현실적)", type: 'S' }, optB: { text: "좀비 사태 터지면 어디로 튀지? (망상)", type: 'N' } },
  { type: 'SN', text: "요리할 때 레시피를 보는 방식은?", chat: "야 라면 끓여봐. 물 얼마나 넣어?", 
    optA: { text: "설명서에 550ml라고 써있음. 계량컵 가져와.", type: 'S' }, optB: { text: "대충 눈대중으로 이 정도면 돼. 감으로!", type: 'N' } },
  { type: 'SN', text: "노래를 들을 때 더 꽂히는 것은?", chat: "이 노래 대박이지 않냐?", 
    optA: { text: "비트랑 멜로디가 너무 좋은데?", type: 'S' }, optB: { text: "가사가 너무 슬퍼.. 내 인생 같아", type: 'N' } },
  { type: 'SN', text: "약속 장소를 설명할 때?", chat: "거기 어떻게 가?", 
    optA: { text: "3번 출구 나와서 100m 직진 후 올리브영 우회전", type: 'S' }, optB: { text: "그 큰 빵집 있잖아? 거기서 꺾으면 힙한 카페 나옴", type: 'N' } },
  { type: 'SN', text: "미래에 대한 생각은?", chat: "10년 뒤에 우린 뭐하고 있을까?", 
    optA: { text: "일단 다음 달 적금부터 붓고 생각하자.", type: 'S' }, optB: { text: "AI가 지배하는 세상에서 우린 뭘 할까?", type: 'N' } },

  // T vs F (판단 기능)
  { type: 'TF', text: "친구가 차 사고가 났다고 전화가 왔다.", chat: "나 방금 차 박음...ㅠㅠ 어떡해", 
    optA: { text: "보험 불렀어? 사진 찍었어? 안 다쳤어?", type: 'T' }, optB: { text: "헐 괜찮아?? 많이 놀랐겠다 ㅠㅠ", type: 'F' } },
  { type: 'TF', text: "친구가 '나 우울해서 머리 잘랐어'라고 한다.", chat: "아 우울해서 머리 잘랐는데 망함;;", 
    optA: { text: "머리가 왜 망해? 미용실 어디 갔는데?", type: 'T' }, optB: { text: "무슨 일 있어? 왜 우울해 ㅠㅠ", type: 'F' } },
  { type: 'TF', text: "고민 상담을 해줄 때 나는?", chat: "나 요즘 이직 고민되는데..", 
    optA: { text: "연봉이랑 워라밸 비교해봐. (해결책 제시)", type: 'T' }, optB: { text: "힘들구나.. 지금 회사 많이 별로야? (공감)", type: 'F' } },
  { type: 'TF', text: "회의 중 의견이 충돌했다.", chat: "김대리님 의견은 현실성이 좀 떨어지는 것 같은데요.", 
    optA: { text: "객관적 데이터로 반박한다.", type: 'T' }, optB: { text: "기분 나쁘지 않게 돌려서 말한다.", type: 'F' } },
  { type: 'TF', text: "나를 더 기쁘게 하는 칭찬은?", chat: "오 이번 프로젝트 고생했어!", 
    optA: { text: "역시 일 잘하네. 성과가 좋아.", type: 'T' }, optB: { text: "너 덕분에 팀 분위기가 너무 좋았어.", type: 'F' } },

  // J vs P (생활 양식)
  { type: 'JP', text: "여행 계획을 짤 때 나는?", chat: "우리 다음 달 제주도 가는 거 계획 짜자.", 
    optA: { text: "엑셀 켜. 시간 단위로 동선 짠다.", type: 'J' }, optB: { text: "비행기만 끊어. 가서 삘 꽂히는 데 가자.", type: 'P' } },
  { type: 'JP', text: "내 방의 상태는?", chat: "야 지금 너네 집 가도 됨?", 
    optA: { text: "어 와도 돼. (항상 정리되어 있음)", type: 'J' }, optB: { text: "잠만 10분만. (발 디딜 틈 만듬)", type: 'P' } },
  { type: 'JP', text: "과제를 할 때 나는?", chat: "과제 마감 내일까진데 다 했냐?", 
    optA: { text: "당연하지. 3일 전에 끝냄.", type: 'J' }, optB: { text: "아 맞다; 오늘 밤새야겠다.", type: 'P' } },
  { type: 'JP', text: "데이트 맛집을 고를 때?", chat: "오늘 저녁 뭐 먹을래?", 
    optA: { text: "이미 예약해둠. 리뷰 4.5점 이상임.", type: 'J' }, optB: { text: "걷다가 냄새 좋은 데 들어가자.", type: 'P' } },
  { type: 'JP', text: "갑자기 일정이 변경되면?", chat: "미안 오늘 약속 1시간만 미뤄도 될까?", 
    optA: { text: "아.. (계획 틀어져서 스트레스 받음)", type: 'J' }, optB: { text: "오키 그럼 그동안 서점 구경하고 있지 뭐.", type: 'P' } },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [testMode, setTestMode] = useState(null);
  const [scores, setScores] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [voteStats, setVoteStats] = useState({ typeA_likes: 0, typeB_likes: 0, total: 0 });
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const [hasVoted, setHasVoted] = useState(false);

  // --- Auth Init ---
  useEffect(() => {
    signInAnonymously(auth);
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- Data Listener (경로를 단순화했습니다: 'mbti_votes') ---
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'mbti_votes')); // 경로 수정됨
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let aLikes = 0; let bLikes = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.vote === 'good') {
          if (data.testMode === 'A') aLikes++;
          if (data.testMode === 'B') bLikes++;
        }
      });
      setVoteStats({ typeA_likes: aLikes, typeB_likes: bLikes, total: aLikes + bLikes });
    });
    return () => unsubscribe();
  }, [user]);

  // --- Actions ---
  const resetTest = () => {
    setScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
    setCurrentQIndex(0);
    setChatHistory([]);
    setIsTyping(false);
    setTestMode(null);
    setView('landing');
  };

  const startSurvey = () => { resetTest(); setTestMode('A'); setView('survey'); };
  const startChat = () => { 
    resetTest(); setTestMode('B'); setView('chat'); 
    setTimeout(() => addBotMessage(QUESTIONS[0].chat), 500); 
  };

  const handleOption = (type) => {
    setScores(prev => ({ ...prev, [type]: prev[type] + 1 }));
    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      return true;
    } else {
      setView('result');
      return false;
    }
  };

  const addBotMessage = (text) => {
    setIsTyping(true);
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'bot', text }]);
      setIsTyping(false);
    }, 800);
  };

  const handleChatReply = (option) => {
    setChatHistory(prev => [...prev, { sender: 'user', text: option.text }]);
    if (handleOption(option.type)) addBotMessage(QUESTIONS[currentQIndex + 1].chat);
  };

  useEffect(() => { if (view === 'chat') chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory, isTyping]);

  const getResultMBTI = () => {
    return [
      scores.E > scores.I ? 'E' : 'I',
      scores.S > scores.N ? 'S' : 'N',
      scores.T > scores.F ? 'T' : 'F',
      scores.J > scores.P ? 'J' : 'P'
    ].join('');
  };

  const submitVote = async (isGood) => {
    if (!user || hasVoted) return;
    try {
      // 경로를 단순화했습니다: 'mbti_votes'
      await addDoc(collection(db, 'mbti_votes'), {
        testMode: testMode,
        vote: isGood ? 'good' : 'bad',
        mbtiResult: getResultMBTI(),
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      setHasVoted(true);
    } catch (e) { console.error(e); alert("오류가 발생했습니다."); }
  };

  // --- Views (기존과 동일, 구조 유지를 위해 간단히 포함) ---
  const LandingView = () => (
    <div className="min-h-screen bg-[#f0f0f0] font-mono p-4 flex flex-col items-center justify-center gap-8">
      <div className="text-center mb-8">
        <div className="bg-[#FFD700] border-4 border-black p-2 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 font-bold">
          A/B TEST PLATFORM
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black drop-shadow-sm">
          당신의 취향에<br/><span className="text-[#007BFF]">투표해 주세요</span>
        </h1>
        <p className="mt-6 text-lg font-bold text-gray-600 max-w-md mx-auto">
          성향 테스트를 위한 두 가지 UX를 비교 체험해보세요.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className={`${STYLES.container} hover:-translate-y-2 transition-transform cursor-pointer group`} onClick={startSurvey}>
          <div className="bg-[#007BFF] w-16 h-16 border-2 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CheckSquare className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black mb-2">TYPE A.</h2>
          <h3 className="text-xl font-bold mb-4 text-gray-500 group-hover:text-black">설문조사 모드</h3>
          <p className="font-medium border-t-2 border-black pt-4">전통적인 문항 체크 방식.<br/>직관적이고 빠릅니다.</p>
          <div className="mt-6 flex justify-end"><ArrowRight className="w-8 h-8" /></div>
        </div>
        <div className={`${STYLES.container} hover:-translate-y-2 transition-transform cursor-pointer group`} onClick={startChat}>
          <div className="bg-[#FFD700] w-16 h-16 border-2 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <MessageSquare className="text-black w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black mb-2">TYPE B.</h2>
          <h3 className="text-xl font-bold mb-4 text-gray-500 group-hover:text-black">상황극 채팅 모드</h3>
          <p className="font-medium border-t-2 border-black pt-4">친구와 카톡하는 듯한 UX.<br/>상황에 과몰입됩니다.</p>
          <div className="mt-6 flex justify-end"><ArrowRight className="w-8 h-8" /></div>
        </div>
      </div>
    </div>
  );

  const SurveyView = () => {
    const q = QUESTIONS[currentQIndex];
    const progress = ((currentQIndex + 1) / QUESTIONS.length) * 100;
    return (
      <div className="min-h-screen bg-[#007BFF] p-4 font-mono flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-8 flex justify-between items-center">
             <h2 className="text-xl font-black">Q {currentQIndex + 1} <span className="text-gray-400">/ {QUESTIONS.length}</span></h2>
             <div className="bg-black text-white px-3 py-1 font-bold text-sm">{q.type}</div>
          </div>
          <div className={`${STYLES.container} min-h-[400px] flex flex-col justify-between`}>
            <div>
              <h1 className="text-2xl md:text-3xl font-black leading-tight mb-8 break-keep">Q. {q.text}</h1>
              <div className="space-y-4">
                <button onClick={() => handleOption(q.optA.type)} className={STYLES.button}>
                  <span className="flex-1 mr-4">A. {q.optA.text}</span><div className="w-6 h-6 bg-black rounded-full border-2 border-white"></div>
                </button>
                <button onClick={() => handleOption(q.optB.type)} className={STYLES.button}>
                  <span className="flex-1 mr-4">B. {q.optB.text}</span><div className="w-6 h-6 bg-white rounded-full border-2 border-black"></div>
                </button>
              </div>
            </div>
            <div className={STYLES.progressBarBg}><div className={STYLES.progressBarFill} style={{ width: `${progress}%` }}></div></div>
          </div>
        </div>
      </div>
    );
  };

  const ChatView = () => {
    const q = QUESTIONS[currentQIndex];
    return (
      <div className="min-h-screen bg-[#FFD700] p-4 font-mono flex items-center justify-center">
        <div className="w-full max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] h-[800px] flex flex-col relative overflow-hidden">
          <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#007BFF] border-2 border-black flex items-center justify-center"><Terminal className="text-white w-6 h-6" /></div>
              <div><div className="font-black text-lg">SIMULATOR_BOT</div><div className="text-xs font-bold text-green-600">● ONLINE</div></div>
            </div>
            <button onClick={resetTest} className="border-2 border-black px-2 py-1 text-xs font-bold hover:bg-black hover:text-white transition">EXIT</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-[#f4f4f0] scrollbar-hide pb-32">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={msg.sender === 'bot' ? STYLES.chatBubbleBot : STYLES.chatBubbleUser}>{msg.text}</div>
            ))}
            {isTyping && <div className={`${STYLES.chatBubbleBot} w-16 flex justify-center items-center gap-1`}><div className="w-2 h-2 bg-black animate-bounce"></div><div className="w-2 h-2 bg-black animate-bounce delay-75"></div><div className="w-2 h-2 bg-black animate-bounce delay-150"></div></div>}
            <div ref={chatEndRef} />
          </div>
          <div className="absolute bottom-0 w-full bg-white border-t-4 border-black p-4 z-20">
            {!isTyping && (
              <div className="flex flex-col gap-2">
                <button onClick={() => handleChatReply(q.optA)} className="bg-white border-2 border-black p-3 text-left font-bold hover:bg-[#007BFF] hover:text-white transition active:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">{q.optA.text}</button>
                <button onClick={() => handleChatReply(q.optB)} className="bg-white border-2 border-black p-3 text-left font-bold hover:bg-[#007BFF] hover:text-white transition active:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">{q.optB.text}</button>
              </div>
            )}
             {isTyping && <div className="text-center font-bold text-gray-400 text-sm py-4">MESSAGING...</div>}
          </div>
        </div>
      </div>
    );
  };

  const ResultView = () => {
    const mbti = getResultMBTI();
    const totalVotes = voteStats.total > 0 ? voteStats.total : 1;
    const aPercent = Math.round((voteStats.typeA_likes / totalVotes) * 100);
    const bPercent = Math.round((voteStats.typeB_likes / totalVotes) * 100);
    const StatBar = ({ label, val1, val2, color }) => (
      <div className="mb-4">
        <div className="flex justify-between text-sm font-bold mb-1"><span>{label[0]}</span><span>{label[1]}</span></div>
        <div className="h-4 border-2 border-black bg-gray-200 flex"><div style={{ width: `${(val1 / (val1 + val2)) * 100}%` }} className={`h-full ${color} border-r-2 border-black`}></div><div className="flex-1 bg-white"></div></div>
      </div>
    );
    return (
      <div className="min-h-screen bg-[#f0f0f0] font-mono p-4 flex items-center justify-center py-12">
        <div className={`${STYLES.container} max-w-2xl w-full text-center relative`}>
          <div className="bg-black text-white inline-block px-4 py-1 font-bold mb-6">FINAL RESULT</div>
          <h1 className="text-6xl md:text-8xl font-black mb-2 text-[#007BFF] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">{mbti}</h1>
          <p className="text-xl font-bold mb-8 border-b-4 border-black pb-6">당신은 {testMode === 'A' ? '설문조사' : '채팅'} 방식으로 테스트했습니다.</p>
          <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left mb-8">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2"><BarChart2 /> DETAIL SCORES</h3>
            <StatBar label={['E (외향)', 'I (내향)']} val1={scores.E} val2={scores.I} color="bg-[#FFD700]" />
            <StatBar label={['S (감각)', 'N (직관)']} val1={scores.S} val2={scores.N} color="bg-[#007BFF]" />
            <StatBar label={['T (사고)', 'F (감정)']} val1={scores.T} val2={scores.F} color="bg-[#FF4500]" />
            <StatBar label={['J (판단)', 'P (인식)']} val1={scores.J} val2={scores.P} color="bg-[#32CD32]" />
          </div>
          <div className="bg-gray-100 border-2 border-black p-6 mb-8">
            {!hasVoted ? (
              <>
                <p className="font-bold text-gray-600 mb-4 text-lg">방금 경험한 테스트({testMode === 'A' ? '설문형' : '채팅형'}) 방식이 어땠나요?</p>
                <div className="flex gap-4">
                  <button onClick={() => submitVote(false)} className="flex-1 bg-white border-2 border-black py-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] hover:bg-gray-50 flex items-center justify-center gap-2"><ThumbsDown className="w-5 h-5" /> 별로예요</button>
                  <button onClick={() => submitVote(true)} className="flex-1 bg-[#FFD700] border-2 border-black py-4 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] hover:bg-[#eec200] flex items-center justify-center gap-2"><ThumbsUp className="w-5 h-5" /> 재밌어요!</button>
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <p className="font-black text-xl mb-4 text-green-600">투표 감사합니다!</p>
                <div className="bg-white border-2 border-black p-4">
                  <h4 className="font-bold text-sm mb-3 text-gray-500">실시간 선호도 현황 (Good 투표수)</h4>
                  <div className="mb-3"><div className="flex justify-between text-xs font-bold mb-1"><span>TYPE A (설문)</span><span>{voteStats.typeA_likes}명 ({aPercent}%)</span></div><div className="w-full bg-gray-200 h-3 border border-black"><div className="bg-[#007BFF] h-full transition-all duration-1000" style={{width: `${aPercent}%`}}></div></div></div>
                  <div><div className="flex justify-between text-xs font-bold mb-1"><span>TYPE B (채팅)</span><span>{voteStats.typeB_likes}명 ({bPercent}%)</span></div><div className="w-full bg-gray-200 h-3 border border-black"><div className="bg-[#FFD700] h-full transition-all duration-1000" style={{width: `${bPercent}%`}}></div></div></div>
                  <p className="text-xs text-right mt-2 text-gray-400">총 투표 참여: {voteStats.total}명</p>
                </div>
              </div>
            )}
          </div>
          <button onClick={resetTest} className={`${STYLES.primaryButton} w-full flex justify-center items-center gap-2`}><RotateCcw /> 처음으로 돌아가기</button>
        </div>
      </div>
    );
  };

  return (
    <>
      {view === 'landing' && <LandingView />}
      {view === 'survey' && <SurveyView />}
      {view === 'chat' && <ChatView />}
      {view === 'result' && <ResultView />}
    </>
  );
}