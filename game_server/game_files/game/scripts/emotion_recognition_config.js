const ENABLE_RECOGNITION = true;
const EMOTION_RECOGNITION_FREQUENCY = 2000;

const Emotion = 
{
    ROBOT: 0,
    NEUTRAL: 1, 
    ANGRY: 2,
    HAPPY: 3,
    SAD: 4,
    SURPRISED: 5,
    DISGUSTED: 6,
    FEARFUL: 7,
};

const EmotionSelector = 
{
    "robot": Emotion.ROBOT,
    "neutral": Emotion.NEUTRAL,
    "angry": Emotion.ANGRY,
    "happy": Emotion.HAPPY,
    "sad": Emotion.SAD,
    "surprised": Emotion.SURPRISED,
    "disgusted": Emotion.DISGUSTED,
    "fearful": Emotion.FEARFUL,
}

const EMOJI_PACK_NAMES = 
[
    'animals',
    'cat',
    'emoji',
    'pepe',
];

var _esr = {};
_esr[Emotion.ROBOT] = "robot";
_esr[Emotion.NEUTRAL] = "neutral";
_esr[Emotion.ANGRY] = "angry";
_esr[Emotion.HAPPY] = "happy";
_esr[Emotion.SAD] = "sad";
_esr[Emotion.SURPRISED] = "surprised";
_esr[Emotion.DISGUSTED] = "disgusted";
_esr[Emotion.FEARFUL] = "fearful";
const EmotionSelectorReverse = _esr;
