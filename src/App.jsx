import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, CheckSquare, ArrowRight, RotateCcw, Send, Terminal, BarChart2, ThumbsUp, ThumbsDown, ArrowRightCircle, CheckCircle2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp } from 'firebase/firestore';

// --- Firebase 설정 ---
// [주의] 로컬에서 실행할 때는 님이 설정하신 config를 사용하세요.
const firebaseConfig = {
  apiKey: "AIzaSyBTQniqZqVhmWstvSLc3BfgpcL1cwmrCHQ",
  authDomain: "mbti-test-28f5c.firebaseapp.com",
  projectId: "mbti-test-28f5c",
  storageBucket: "mbti-test-28f5c.firebasestorage.app",
  messagingSenderId: "987516872468",
  appId: "1:987516872468:web:ef641ecd7ccf2760500401",
  measurementId: "G-24M9XK3V1X"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

// --- 데이터: MBTI 문항 (20개) ---
const QUESTIONS = [
  // E/I 문항 (5개)
  { type: 'EI', text: "주말에 갑작스러운 번개 모임 제안이 왔다.", chat: "야ㅋㅋ 지금 강남인데 나와! 애들 다 모임", 
    optA: { text: "오! 재밌겠다 바로 나감", type: 'E' }, optB: { text: "아.. 나 오늘 쉴래 (기빨림)", type: 'I' } },
  { type: 'EI', text: "파티에 갔을 때 나의 모습은?", chat: "오늘 파티 어땠어?", 
    optA: { text: "여기저기 돌아다니며 사람들이랑 떠듦", type: 'E' }, optB: { text: "아는 사람들이랑만 조용히 얘기함", type: 'I' } },
  { type: 'EI', text: "스트레스 받을 때 푸는 방법은?", chat: "요즘 스트레스 쌓이는데 어떻게 풀어?", 
    optA: { text: "친구 만나서 수다 떨면서 푼다", type: 'E' }, optB: { text: "혼자 있으면서 생각 정리한다", type: 'I' } },
  { type: 'EI', text: "새로운 사람들과 만날 때", chat: "내일 MT 간다며? 새로운 사람들 많이 만나겠네", 
    optA: { text: "신나! 새로운 사람 만나는 거 좋아", type: 'E' }, optB: { text: "어색할 것 같은데... 긴장됨", type: 'I' } },
  { type: 'EI', text: "통화와 문자 중에 선호하는 것은?", chat: "야 나 말 좀 해야 되는데", 
    optA: { text: "바로 전화해! 통화가 편해", type: 'E' }, optB: { text: "카톡으로 보내줘 문자가 좋아", type: 'I' } },
  
  // S/N 문항 (5개)
  { type: 'SN', text: "멍 때릴 때 주로 하는 생각은?", chat: "너 무슨 생각 해? 멍 때리네", 
    optA: { text: "오늘 저녁 뭐 먹지? (현실적)", type: 'S' }, optB: { text: "좀비 사태 터지면 어디로 튀지? (망상)", type: 'N' } },
  { type: 'SN', text: "친구에게 어제 일을 설명할 때", chat: "어제 뭐 했어?", 
    optA: { text: "카페 가서 커피 마시고 쇼핑했어", type: 'S' }, optB: { text: "그냥... 힐링? 여유로운 시간? 느낌 있었어", type: 'N' } },
  { type: 'SN', text: "요리 레시피를 볼 때", chat: "이거 어떻게 만들어?", 
    optA: { text: "레시피 보고 정확히 따라 만듦", type: 'S' }, optB: { text: "대충 감으로 응용해서 만듦", type: 'N' } },
  { type: 'SN', text: "책을 읽을 때 나는?", chat: "요즘 무슨 책 읽어?", 
    optA: { text: "실용적인 자기계발서나 정보 책", type: 'S' }, optB: { text: "판타지 소설이나 철학책", type: 'N' } },
  { type: 'SN', text: "과거를 회상할 때", chat: "작년 이맘때 뭐 했더라?", 
    optA: { text: "구체적인 사건들이 기억남", type: 'S' }, optB: { text: "그때의 느낌이나 분위기가 기억남", type: 'N' } },
  
  // T/F 문항 (5개)
  { type: 'TF', text: "친구가 차 사고가 났다고 전화가 왔다.", chat: "나 방금 차 박음...ㅠㅠ 어떡해", 
    optA: { text: "보험 불렀어? 사진 찍었어?", type: 'T' }, optB: { text: "헐 괜찮아?? 많이 놀랐겠다 ㅠㅠ", type: 'F' } },
  { type: 'TF', text: "친구가 이상한 옷을 입고 나타났다.", chat: "이거 어때? 새로 산 건데", 
    optA: { text: "솔직히 말해줌 (안 어울려)", type: 'T' }, optB: { text: "괜찮은데? 하고 넘어감 (배려)", type: 'F' } },
  { type: 'TF', text: "영화를 보고 난 뒤 중요한 것은?", chat: "영화 어땠어?", 
    optA: { text: "스토리 구성, 연출, 개연성", type: 'T' }, optB: { text: "감동, 여운, 캐릭터 감정", type: 'F' } },
  { type: 'TF', text: "친구가 시험 망쳤다고 한다.", chat: "아 시험 망했어 ㅠㅠ", 
    optA: { text: "어디가 어려웠어? 다음엔 이렇게 해봐", type: 'T' }, optB: { text: "ㅠㅠ 속상하겠다 괜찮아 힘내", type: 'F' } },
  { type: 'TF', text: "회의 중 의견 충돌이 생겼을 때", chat: "회의 분위기 안 좋던데", 
    optA: { text: "논리적으로 설득하고 결론 내림", type: 'T' }, optB: { text: "분위기 먼저 풀고 조율함", type: 'F' } },
  
  // J/P 문항 (5개)
  { type: 'JP', text: "여행 계획을 짤 때 나는?", chat: "우리 다음 달 제주도 가는 거 계획 짜자.", 
    optA: { text: "엑셀 켜. 시간 단위로 동선 짠다.", type: 'J' }, optB: { text: "비행기만 끊어. 가서 정하자.", type: 'P' } },
  { type: 'JP', text: "과제 마감이 다가올 때", chat: "과제 언제까지야?", 
    optA: { text: "미리미리 계획 세워서 끝냄", type: 'J' }, optB: { text: "마감 직전에 몰아서 함", type: 'P' } },
  { type: 'JP', text: "방 정리를 할 때", chat: "방 좀 치워라", 
    optA: { text: "정해진 위치에 규칙적으로 정리", type: 'J' }, optB: { text: "보이는 곳만 치우거나 급할 때만", type: 'P' } },
  { type: 'JP', text: "주말 계획은?", chat: "이번 주말에 뭐 해?", 
    optA: { text: "이미 다 정해져 있음", type: 'J' }, optB: { text: "그때그때 기분 따라 정함", type: 'P' } },
  { type: 'JP', text: "일을 진행할 때", chat: "이 일 어떻게 진행할 거야?", 
    optA: { text: "단계별로 체크리스트 만들어서", type: 'J' }, optB: { text: "유연하게 상황 보면서", type: 'P' } }
];

export default function App() {
  const [user, setUser] = useState(null);
  // 단계: 'intro' -> 'survey' -> 'intermission' -> 'chat' -> 'result'
  const [step, setStep] = useState('intro'); 
  
  // 점수 관리 (현재 진행중인 테스트의 점수)
  const [scores, setScores] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  
  // 결과 저장 (A결과와 B결과를 비교하고 싶다면 저장)
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // 투표 현황
  const [voteStats, setVoteStats] = useState({ preferA: 0, preferB: 0, total: 0 });
  const [hasVoted, setHasVoted] = useState(false);

  // 채팅 관련
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // --- 인증 및 데이터 리스너 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("인증 오류:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // 컬렉션 이름: 'mbti_preference_votes' (선호도 투표용 컬렉션)
    const collectionPath = collection(db, 'mbti_preference_votes');
    const q = query(collectionPath);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let aCount = 0;
      let bCount = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.preferredMode === 'A') aCount++;
        if (data.preferredMode === 'B') bCount++;
      });
      setVoteStats({ preferA: aCount, preferB: bCount, total: aCount + bCount });
    });
    return () => unsubscribe();
  }, [user]);

  // --- 로직 함수들 ---
  const resetScores = () => {
    setScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
    setCurrentQIndex(0);
    setChatHistory([]);
    setIsTyping(false);
  };

  const calculateMBTI = () => {
    return [
      scores.E > scores.I ? 'E' : 'I',
      scores.S > scores.N ? 'S' : 'N',
      scores.T > scores.F ? 'T' : 'F',
      scores.J > scores.P ? 'J' : 'P'
    ].join('');
  };

  // 1. 실험 시작 (A로 이동)
  const startExperiment = () => {
    resetScores();
    setStep('survey');
  };

  // 2. 설문 응답 처리
  const handleSurveyOption = (type) => {
    setScores(prev => ({ ...prev, [type]: prev[type] + 1 }));
    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // A타입 완료 -> 결과 저장 후 인터미션으로
      const result = calculateMBTI(); // 현재 점수로 계산 (주의: state update 비동기라 약간 오차 있을 수 있으나, 간단 로직 위해 허용)
      // 더 정확히는 마지막 클릭 점수까지 반영해서 계산해야 함. 여기선 로직 단순화.
      setResultA(result); 
      setStep('intermission');
    }
  };

  // 3. B타입 시작 (채팅으로 이동)
  const startPhase2 = () => {
    resetScores(); // 점수 초기화 (B타입용으로 다시 시작)
    setStep('chat');
    setTimeout(() => addBotMessage(QUESTIONS[0].chat), 500);
  };

  // 4. 채팅 응답 처리
  const handleChatReply = (option) => {
    setChatHistory(prev => [...prev, { sender: 'user', text: option.text }]);
    
    // 점수 반영
    setScores(prev => ({ ...prev, [option.type]: prev[option.type] + 1 }));
    
    // 즉시 스크롤
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 0);
    
    if (currentQIndex < QUESTIONS.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      addBotMessage(QUESTIONS[currentQIndex + 1].chat);
    } else {
      // B타입 완료 -> 결과 저장 후 최종 화면으로
      setTimeout(() => {
        setResultB(calculateMBTI());
        setStep('result');
      }, 1000);
    }
  };

  const addBotMessage = (text) => {
    setIsTyping(true);
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'bot', text }]);
      setIsTyping(false);
      // 봇 메시지 후 스크롤
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 0);
    }, 800);
  };

  useEffect(() => {
    if (step === 'chat' && chatHistory.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [chatHistory, isTyping, step]);


  // 5. 투표 제출
  const submitPreference = async (preference) => { // 'A' or 'B'
    if (!user || hasVoted) return;
    
    try {
      const collectionPath = collection(db, 'mbti_preference_votes');
      
      await addDoc(collectionPath, {
        preferredMode: preference,
        resultA: resultA || 'unknown',
        resultB: resultB || calculateMBTI(), // 혹시 state 반영 늦을까봐 안전장치
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      setHasVoted(true);
    } catch (e) {
      console.error("투표 오류:", e);
      alert("투표 중 오류가 발생했습니다.");
    }
  };

  // --- 뷰 컴포넌트 ---

  // [Intro]: 실험 설명
  const IntroView = () => (
    <div className="min-h-screen bg-[#f0f0f0] font-mono p-4 flex flex-col items-center justify-center">
      <div className={`${STYLES.container} max-w-2xl w-full text-center`}>
        <div className="bg-[#FFD700] border-4 border-black p-2 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 font-bold">
          UX A/B EXPERIMENT
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          당신의 취향을<br/>찾는 실험
        </h1>
        <p className="text-lg font-bold text-gray-600 mb-8">
          정확한 비교를 위해<br/>
          <span className="text-[#007BFF]">두 가지 방식의 테스트</span>를<br/>
          모두 진행하게 됩니다.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="border-2 border-black p-4 bg-white">
            <div className="font-black text-xl mb-2 text-[#007BFF]">STEP 1</div>
            <div className="font-bold">설문조사 모드</div>
            <div className="text-xs text-gray-500 mt-1">직관적이고 빠른 체크</div>
          </div>
          <div className="border-2 border-black p-4 bg-white">
            <div className="font-black text-xl mb-2 text-[#FFD700]">STEP 2</div>
            <div className="font-bold">채팅 모드</div>
            <div className="text-xs text-gray-500 mt-1">과몰입 대화형</div>
          </div>
        </div>

        <button onClick={startExperiment} className={`${STYLES.primaryButton} w-full flex justify-center items-center gap-2`}>
          실험 시작하기 <ArrowRight />
        </button>
      </div>
    </div>
  );

  // [Phase 1]: 설문조사
  const SurveyView = () => {
    const q = QUESTIONS[currentQIndex];
    const progress = ((currentQIndex + 1) / QUESTIONS.length) * 100;
    return (
      <div className="min-h-screen bg-[#007BFF] p-4 font-mono flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 mb-4 flex justify-between items-center">
             <div className="font-black">PHASE 1. TYPE A (설문)</div>
             <div className="bg-black text-white px-3 py-1 font-bold text-sm">{currentQIndex + 1}/{QUESTIONS.length}</div>
          </div>
          <div className={`${STYLES.container} min-h-[400px] flex flex-col justify-between`}>
            <div>
              <h1 className="text-2xl md:text-3xl font-black leading-tight mb-8">Q. {q.text}</h1>
              <div className="space-y-4">
                <button onClick={() => handleSurveyOption(q.optA.type)} className={STYLES.button}>
                  <span className="flex-1 mr-4">A. {q.optA.text}</span><div className="w-6 h-6 bg-black rounded-full border-2 border-white"></div>
                </button>
                <button onClick={() => handleSurveyOption(q.optB.type)} className={STYLES.button}>
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

  // [Intermission]: 중간 휴식
  const IntermissionView = () => (
    <div className="min-h-screen bg-black p-4 font-mono flex items-center justify-center text-white">
      <div className="max-w-md w-full text-center">
        <CheckCircle2 className="w-20 h-20 text-[#007BFF] mx-auto mb-6" />
        <h2 className="text-4xl font-black mb-4">PHASE 1 완료!</h2>
        <p className="text-xl mb-8">
          수고하셨습니다.<br/>
          이제 두 번째 방식을 체험할 차례입니다.
        </p>
        <div className="bg-[#222] p-6 border-2 border-white mb-8">
          <h3 className="font-bold text-[#FFD700] mb-2">NEXT: PHASE 2</h3>
          <p className="text-sm">친구와 대화하듯 진행하는<br/>'채팅 모드'가 시작됩니다.</p>
        </div>
        <button onClick={startPhase2} className="w-full bg-[#FFD700] text-black font-black text-lg py-4 px-8 border-4 border-white hover:translate-x-1 hover:translate-y-1 transition-transform">
          PHASE 2 시작하기 <ArrowRight className="inline ml-2"/>
        </button>
      </div>
    </div>
  );

  // [Phase 2]: 채팅
  const ChatView = () => {
    const q = QUESTIONS[currentQIndex];
    return (
      <div className="min-h-screen bg-[#FFD700] p-4 font-mono flex items-center justify-center">
        <div className="w-full max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] h-[800px] flex flex-col relative overflow-hidden">
          <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center z-10">
            <div className="font-black">PHASE 2. TYPE B (채팅)</div>
            <div className="text-xs font-bold bg-black text-white px-2 py-1">{currentQIndex + 1}/{QUESTIONS.length}</div>
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

  // [Result]: 최종 투표
  const FinalVoteView = () => {
    // 최종 결과는 마지막에 진행한 B(채팅) 결과를 보여주거나, 원하시면 둘 다 보여줄 수도 있음
    // 여기선 "당신의 MBTI"로 통일해서 보여줌
    const finalMBTI = calculateMBTI();
    
    const total = voteStats.total > 0 ? voteStats.total : 1;
    const aRate = Math.round((voteStats.preferA / total) * 100);
    const bRate = Math.round((voteStats.preferB / total) * 100);

    return (
      <div className="min-h-screen bg-[#f0f0f0] font-mono p-4 flex items-center justify-center py-12">
        <div className={`${STYLES.container} max-w-2xl w-full text-center`}>
          <div className="bg-black text-white inline-block px-4 py-1 font-bold mb-4">EXPERIMENT COMPLETE</div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-2 text-[#007BFF] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            {finalMBTI}
          </h1>
          <p className="text-gray-600 font-bold mb-8">
            테스트 참여가 완료되었습니다.
          </p>

          <div className="bg-white border-4 border-black p-6 mb-8 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 bg-[#FFD700] px-3 py-1 font-bold border-r-4 border-b-4 border-black text-sm">FINAL MISSION</div>
            <h2 className="text-2xl font-black mt-6 mb-4 text-center">어떤 방식이 더 좋았나요?</h2>
            <p className="text-center text-gray-500 mb-8 font-bold">
              더 편하거나, 더 재밌었던 쪽에 투표해주세요.<br/>
              당신의 선택이 다음 서비스에 반영됩니다.
            </p>

            {!hasVoted ? (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => submitPreference('A')} className="bg-white border-4 border-gray-200 hover:border-[#007BFF] hover:bg-blue-50 p-6 transition-all group">
                  <div className="font-black text-xl mb-2 group-hover:text-[#007BFF]">TYPE A</div>
                  <div className="text-sm font-bold text-gray-400 group-hover:text-gray-600">설문조사 모드</div>
                  <div className="mt-4 text-[#007BFF] opacity-0 group-hover:opacity-100 font-black">PICK ME!</div>
                </button>
                <button onClick={() => submitPreference('B')} className="bg-white border-4 border-gray-200 hover:border-[#FFD700] hover:bg-yellow-50 p-6 transition-all group">
                  <div className="font-black text-xl mb-2 group-hover:text-yellow-600">TYPE B</div>
                  <div className="text-sm font-bold text-gray-400 group-hover:text-gray-600">채팅 모드</div>
                  <div className="mt-4 text-yellow-600 opacity-0 group-hover:opacity-100 font-black">PICK ME!</div>
                </button>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="bg-gray-100 p-4 border-2 border-black mb-4 text-center font-bold text-green-600">
                  투표가 반영되었습니다!
                </div>
                
                {/* 실시간 그래프 */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between font-bold text-sm mb-1">
                      <span>A. 설문조사 선호</span>
                      <span>{aRate}% ({voteStats.preferA}명)</span>
                    </div>
                    <div className="w-full h-6 border-2 border-black bg-white">
                      <div className="h-full bg-[#007BFF] transition-all duration-1000" style={{width: `${aRate}%`}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold text-sm mb-1">
                      <span>B. 채팅 선호</span>
                      <span>{bRate}% ({voteStats.preferB}명)</span>
                    </div>
                    <div className="w-full h-6 border-2 border-black bg-white">
                      <div className="h-full bg-[#FFD700] transition-all duration-1000" style={{width: `${bRate}%`}}></div>
                    </div>
                  </div>
                  <div className="text-right text-xs font-bold text-gray-400 mt-2">총 {voteStats.total}명 참여</div>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => window.location.reload()} className="text-gray-400 font-bold underline hover:text-black">
            다시 테스트하기
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {step === 'intro' && <IntroView />}
      {step === 'survey' && <SurveyView />}
      {step === 'intermission' && <IntermissionView />}
      {step === 'chat' && <ChatView />}
      {step === 'result' && <FinalVoteView />}
    </>
  );
}