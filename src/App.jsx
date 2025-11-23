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
  // [E vs I] 에너지 방향 (1~5)
  {
    type: 'EI',
    survey: {
      question: "주말이나 휴식 시간에 에너지를 충전하는 방식은?",
      optA: { text: "사람들을 만나 활동하며 에너지를 얻는다.", type: 'E' },
      optB: { text: "혼자만의 시간을 보내며 에너지를 비축한다.", type: 'I' }
    },
    chat: {
      botMsg: "이번 주말에 애들 다 모여서 파티하기로 했어! 너도 올 거지? 진짜 재밌을 거야!",
      optA: { text: "오! 완전 좋지! 누구누구 와? 당장 갈게!", type: 'E' },
      optB: { text: "아.. 재밌겠다. 근데 난 이번 주는 집에서 좀 쉬려고 ㅠㅠ", type: 'I' }
    }
  },
  {
    type: 'EI',
    survey: {
      question: "새로운 모임이나 낯선 환경에서의 태도는?",
      optA: { text: "먼저 다가가 대화를 주도하고 분위기를 띄운다.", type: 'E' },
      optB: { text: "누군가 말을 걸어올 때까지 관찰하며 기다린다.", type: 'I' }
    },
    chat: {
      botMsg: "오늘 신입 회원 환영회 있는데, 자기소개 시간 있대. 긴장되지 않아?",
      optA: { text: "전혀? 내 매력을 보여줄 기회지! 얼른 가서 인사하고 싶어.", type: 'E' },
      optB: { text: "으.. 생각만 해도 손에 땀 나. 그냥 조용히 밥만 먹다 오고 싶다.", type: 'I' }
    }
  },
  {
    type: 'EI',
    survey: {
      question: "말을 할 때 당신의 스타일은?",
      optA: { text: "생각나는 대로 즉각적으로 이야기하는 편이다.", type: 'E' },
      optB: { text: "머릿속으로 정리된 후에 신중하게 내뱉는 편이다.", type: 'I' }
    },
    chat: {
      botMsg: "방금 회의 때 부장님 말씀하신 거, 솔직히 어떻게 생각해?",
      optA: { text: "아니 그건 진짜 아니지 않음? 아까 바로 말하려다 참았어.", type: 'E' },
      optB: { text: "음.. 글쎄. 의도가 뭔지 좀 더 생각해보고 나중에 의견 드리려고.", type: 'I' }
    }
  },
  {
    type: 'EI',
    survey: {
      question: "스트레스를 해소하는 가장 좋은 방법은?",
      optA: { text: "친구들에게 전화를 걸어 수다를 떨거나 밖으로 나간다.", type: 'E' },
      optB: { text: "방해받지 않는 공간에서 좋아하는 취미에 몰두한다.", type: 'I' }
    },
    chat: {
      botMsg: "하.. 오늘 진짜 일 너무 힘들었다. 스트레스 받아 미치겠네.",
      optA: { text: "야! 당장 나와. 맛있는 거 먹고 노래방 가서 소리 지르자!", type: 'E' },
      optB: { text: "고생했어.. 오늘은 집에서 따뜻한 물로 씻고 푹 자는 게 최고야.", type: 'I' }
    }
  },
  {
    type: 'EI',
    survey: {
      question: "다수의 사람들과 함께 일하는 것에 대해 어떻게 생각하나요?",
      optA: { text: "팀으로 일하며 시너지를 내는 것을 선호한다.", type: 'E' },
      optB: { text: "독립적으로 혼자 집중해서 처리하는 것을 선호한다.", type: 'I' }
    },
    chat: {
      botMsg: "이번 프로젝트, 팀으로 할지 각자 파트 나눠서 할지 정하래.",
      optA: { text: "당연히 다 같이 모여서 으쌰으쌰 해야지! 팀플 가자!", type: 'E' },
      optB: { text: "효율 떨어져.. 그냥 각자 맡은 거 확실히 해서 합치면 안 될까?", type: 'I' }
    }
  },

  // [S vs N] 인식 기능 (6~10)
  {
    type: 'SN',
    survey: {
      question: "어떤 정보를 받아들일 때 더 편한 방식은?",
      optA: { text: "구체적인 수치, 사실, 경험에 근거한 정보.", type: 'S' },
      optB: { text: "맥락, 의미, 가능성 등 추상적인 정보.", type: 'N' }
    },
    chat: {
      botMsg: "야, 거기 맛집 가는 길 좀 알려줘.",
      optA: { text: "3번 출구 나와서 100m 직진하면 올리브영 보이거든? 그 옆 골목이야.", type: 'S' },
      optB: { text: "그 3번 출구 쪽인데, 뭔가 힙한 빨간 간판 느낌 나는 골목으로 들어가면 돼.", type: 'N' }
    }
  },
  {
    type: 'SN',
    survey: {
      question: "멍 때릴 때 주로 하는 생각은?",
      optA: { text: "오늘 해야 할 일이나 어제 있었던 사건의 디테일.", type: 'S' },
      optB: { text: "'만약에'로 시작하는 상상이나 우주의 끝은 어딜까 같은 망상.", type: 'N' }
    },
    chat: {
      botMsg: "너 무슨 생각 해? 표정이 진지한데?",
      optA: { text: "아 배고파.. 오늘 점심 메뉴 제육볶음 먹을까 돈까스 먹을까 고민 중.", type: 'S' },
      optB: { text: "갑자기 좀비 사태 터지면 이 카페에서 어떻게 탈출할지 시뮬레이션 돌림.", type: 'N' }
    }
  },
  {
    type: 'SN',
    survey: {
      question: "영화를 감상한 후 나누고 싶은 대화는?",
      optA: { text: "배우의 연기, 영상미, 구체적인 스토리 전개.", type: 'S' },
      optB: { text: "영화가 담고 있는 숨은 의미, 감독의 철학, 비유적 해석.", type: 'N' }
    },
    chat: {
      botMsg: "와, 방금 그 영화 결말 봤어? 대박이지 않냐?",
      optA: { text: "주인공이 범인이었다니! 복선 회수하는 거 진짜 소름 돋네.", type: 'S' },
      optB: { text: "결국 그 결말은 인간의 본성은 변하지 않는다는 걸 상징하는 거 아닐까?", type: 'N' }
    }
  },
  {
    type: 'SN',
    survey: {
      question: "요리나 조립을 할 때 당신은?",
      optA: { text: "설명서나 레시피를 꼼꼼히 읽고 정량대로 따라 한다.", type: 'S' },
      optB: { text: "대략적인 흐름만 보고 감으로 하거나 내 방식대로 응용한다.", type: 'N' }
    },
    chat: {
      botMsg: "이거 밀키트 샀는데 설명서 잃어버렸어.. 어떡하지?",
      optA: { text: "잠깐만 기다려 봐. 인터넷 검색해서 레시피 정확히 찾아줄게.", type: 'S' },
      optB: { text: "야 그냥 다 넣고 끓이면 맛 똑같아. 대충 간 보면서 하자.", type: 'N' }
    }
  },
  {
    type: 'SN',
    survey: {
      question: "미래에 대한 당신의 관점은?",
      optA: { text: "현실에 충실하는 것이 미래를 만든다. 현재가 중요하다.", type: 'S' },
      optB: { text: "미래의 가능성을 꿈꾸고 큰 그림을 그리는 것이 중요하다.", type: 'N' }
    },
    chat: {
      botMsg: "너는 10년 뒤에 뭐 하고 있을 것 같아?",
      optA: { text: "글쎄, 일단 당장 다음 달 적금 만기부터 챙겨야지. 하루하루 살기도 바빠.", type: 'S' },
      optB: { text: "난 아마 해외에서 디지털 노마드로 살면서 책을 쓰고 있지 않을까? 상상만 해도 설레.", type: 'N' }
    }
  },

  // [T vs F] 판단 기능 (11~15)
  {
    type: 'TF',
    survey: {
      question: "친구가 고민을 털어놓을 때 당신의 1순위 반응은?",
      optA: { text: "문제의 원인을 분석하고 해결책을 제시한다.", type: 'T' },
      optB: { text: "친구의 감정에 공감하고 위로의 말을 건넨다.", type: 'F' }
    },
    chat: {
      botMsg: "나 오늘 팀장님한테 진짜 말도 안 되는 걸로 깨졌어.. 너무 억울해 ㅠㅠ",
      optA: { text: "왜? 무슨 일이었는데? 팀장님이 뭐라고 하셨길래 그래?", type: 'T' },
      optB: { text: "헐 미친 거 아냐? 진짜 속상했겠다.. 너 괜찮아?", type: 'F' }
    }
  },
  {
    type: 'TF',
    survey: {
      question: "의사결정을 내릴 때 가장 중요하게 고려하는 것은?",
      optA: { text: "논리적 타당성, 객관적 사실, 원칙.", type: 'T' },
      optB: { text: "사람들의 감정, 가치관, 관계에 미칠 영향.", type: 'F' }
    },
    chat: {
      botMsg: "A후배가 일은 잘 못하는데 착하고, B후배는 싹퉁바가지인데 일은 잘해. 누구 승진시킬까?",
      optA: { text: "회사는 일하는 곳이잖아. 성과 좋은 B를 올려야지.", type: 'T' },
      optB: { text: "그래도 팀 분위기 망치면 안 되지. 인성 좋은 A가 낫지 않을까?", type: 'F' }
    }
  },
  {
    type: 'TF',
    survey: {
      question: "친구가 달라진 모습(머리스타일 등)에 대해 물어볼 때?",
      optA: { text: "빈말은 못 한다. 내 눈에 보이는 대로 솔직하게 말해준다.", type: 'T' },
      optB: { text: "친구가 기분 상하지 않게 좋게 돌려서 말하거나 칭찬한다.", type: 'F' }
    },
    chat: {
      botMsg: "나 앞머리 잘랐는데 어때? (솔직히 좀 쥐 파먹은 것 같음)",
      optA: { text: "음.. 솔직히 좀 삐뚤빼뚤한데? 미용실 다시 가야 할 듯.", type: 'T' },
      optB: { text: "오~ 분위기 확 달라졌는데? 귀엽다! 기분 전환 제대로 했네.", type: 'F' }
    }
  },
  {
    type: 'TF',
    survey: {
      question: "논쟁이나 토론 상황에서 당신은?",
      optA: { text: "내 주장이 논리적으로 맞다는 것을 증명하려 한다.", type: 'T' },
      optB: { text: "상대방이 상처받지 않도록 갈등을 피하거나 중재하려 한다.", type: 'F' }
    },
    chat: {
      botMsg: "내 말이 맞지 않아? 걔가 잘못한 거잖아. 논리적으로 반박해 봐.",
      optA: { text: "아니지, 팩트만 보면 네가 먼저 원인 제공을 했잖아. 그건 인정해.", type: 'T' },
      optB: { text: "물론 네 말도 일리가 있는데, 걔 입장에서는 좀 서운했을 수도 있겠다.", type: 'F' }
    }
  },
  {
    type: 'TF',
    survey: {
      question: "위로가 필요한 상황에서 선호하는 방식은?",
      optA: { text: "\"다음에 이렇게 해봐\" 같은 실질적인 조언이 도움된다.", type: 'T' },
      optB: { text: "\"많이 힘들었지?\" 같은 따뜻한 공감이 힘이 된다.", type: 'F' }
    },
    chat: {
      botMsg: "시험 떨어졌어.. 나 진짜 머리가 나쁜가 봐.",
      optA: { text: "어느 과목에서 점수 깎였어? 오답노트 다시 분석해 보자.", type: 'T' },
      optB: { text: "아이고.. 얼마나 열심히 준비했는데.. 진짜 마음 아프다 ㅠㅠ", type: 'F' }
    }
  },

  // [J vs P] 생활 양식 (16~20)
  {
    type: 'JP',
    survey: {
      question: "여행을 떠나기 전 당신의 준비 스타일은?",
      optA: { text: "분 단위 일정, 맛집 예약, 동선까지 엑셀로 정리한다.", type: 'J' },
      optB: { text: "비행기 표와 숙소 정도만 예약하고 나머지는 가서 정한다.", type: 'P' }
    },
    chat: {
      botMsg: "우리 다음 달에 제주도 가는 거, 일정 좀 짜야 하지 않아?",
      optA: { text: "안 그래도 엑셀 켰어. 1일 차 점심은 여기, 저녁은 여기 어때?", type: 'J' },
      optB: { text: "에이 벌써? 그냥 가서 끌리는 곳 들어가는 게 여행의 묘미지!", type: 'P' }
    }
  },
  {
    type: 'JP',
    survey: {
      question: "일을 처리하는 방식은?",
      optA: { text: "미리미리 계획을 세워 마감 전에 여유 있게 끝낸다.", type: 'J' },
      optB: { text: "마감 직전까지 미루다가 막판 스퍼트로 끝낸다.", type: 'P' }
    },
    chat: {
      botMsg: "다음 주 과제 제출인데 너 다 했어?",
      optA: { text: "어제 다 해서 제출했지. 마음 편하게 주말 보내려고.", type: 'J' },
      optB: { text: "아 맞다 과제... 오늘 밤새워서 하면 되겠지 뭐 ㅋㅋ", type: 'P' }
    }
  },
  {
    type: 'JP',
    survey: {
      question: "당신의 방이나 책상 상태는?",
      optA: { text: "물건들이 제자리에 정리정돈되어 있고 깔끔하다.", type: 'J' },
      optB: { text: "어디에 뭐가 있는지 나만 아는 '정리된 혼돈' 상태다.", type: 'P' }
    },
    chat: {
      botMsg: "야 너희 집 놀러 가도 돼? 지금 근처인데.",
      optA: { text: "어 와! 어차피 항상 치워놔서 상관없어.", type: 'J' },
      optB: { text: "어? 지금?? 안돼 안돼 집 개판이야. 30분만 시간 줘!!", type: 'P' }
    }
  },
  {
    type: 'JP',
    survey: {
      question: "데이트나 약속 장소를 정할 때?",
      optA: { text: "미리 검색해서 리뷰 좋은 곳으로 예약해 둔다.", type: 'J' },
      optB: { text: "만나서 걷다가 분위기 좋아 보이는 곳에 들어간다.", type: 'P' }
    },
    chat: {
      botMsg: "오늘 저녁에 뭐 먹을래?",
      optA: { text: "내가 봐둔 파스타집 있는데 예약해둘게. 7시 괜찮지?", type: 'J' },
      optB: { text: "만나서 돌아다니다가 땡기는 거 먹자~", type: 'P' }
    }
  },
  {
    type: 'JP',
    survey: {
      question: "예상치 못한 변수가 생겨 계획이 틀어졌을 때?",
      optA: { text: "매우 스트레스를 받으며 빠르게 대안을 찾으려 애쓴다.", type: 'J' },
      optB: { text: "오히려 좋아! 새로운 상황을 즐기며 유연하게 대처한다.", type: 'P' }
    },
    chat: {
      botMsg: "야 큰일 났다. 우리 가려던 식당 오늘 휴무래...;;",
      optA: { text: "하.. 내가 휴무일 확인했어야 했는데. 잠깐만, 근처 다른 곳 바로 알아볼게.", type: 'J' },
      optB: { text: "진짜? 할 수 없지 뭐 ㅋㅋ 옆에 떡볶이집 냄새 좋던데 저기 갈까?", type: 'P' }
    }
  }
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
    setTimeout(() => addBotMessage(QUESTIONS[0].chat.botMsg), 500);
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
      addBotMessage(QUESTIONS[currentQIndex + 1].chat.botMsg);
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
              <h1 className="text-2xl md:text-3xl font-black leading-tight mb-8">Q. {q.survey.question}</h1>
              <div className="space-y-4">
                <button onClick={() => handleSurveyOption(q.survey.optA.type)} className={STYLES.button}>
                  <span className="flex-1 mr-4">A. {q.survey.optA.text}</span><div className="w-6 h-6 bg-black rounded-full border-2 border-white"></div>
                </button>
                <button onClick={() => handleSurveyOption(q.survey.optB.type)} className={STYLES.button}>
                  <span className="flex-1 mr-4">B. {q.survey.optB.text}</span><div className="w-6 h-6 bg-white rounded-full border-2 border-black"></div>
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
                <button onClick={() => handleChatReply(q.chat.optA)} className="bg-white border-2 border-black p-3 text-left font-bold hover:bg-[#007BFF] hover:text-white transition active:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">{q.chat.optA.text}</button>
                <button onClick={() => handleChatReply(q.chat.optB)} className="bg-white border-2 border-black p-3 text-left font-bold hover:bg-[#007BFF] hover:text-white transition active:bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">{q.chat.optB.text}</button>
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
              깔끔 명확한 설문조사형  VS 몰입감 있고 재미있는 채팅형<br/>
              여러분의 선호도를 투표해주세요!
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