const lamejs = require("lamejs");

export const audioContext = new Audio();
export const globalState = {
  isInChatPage: false,
};

// audioContext.onstopplay = () => (playStatus.playing = false);
// audioContext.onplay = () => (playStatus.playing = true);
// audioContext.onplayend = () => (playStatus.playing = false);
// audioContext.onpauseplay = () => (playStatus.playing = false);

export const clearAudioWaitingList = () => {
  playStatus.waitingList = [];
  playStatus.playing = false;
  audioContext.pause();
  audioContext.currentTime = 0;
  console.log("clear", playStatus);
};

//  audioContext.paused 总是返回true，只能通过自己监听状态
export const playStatus = {
  playing: false,
  waitingList: [],
};
export const playAudio = (src, waiting = false) => {
  const play = () => {
    audioContext.currentTime = 0;
    audioContext.src = src;
    audioContext.play();
  };

  if (!waiting) {
    play();
  } else {
    console.log("finalContent", playStatus, audioContext.paused);
    if (playStatus.playing) {
      console.log("等待播放");
      playStatus.waitingList.push(src);
      audioContext.removeEventListener("ended", continueToPlay);
      audioContext.addEventListener("ended", continueToPlay);
    } else {
      console.log("直接播放");
      play();
    }
  }

  return new Promise((resolve) => {
    audioContext.addEventListener("ended", () => {
      resolve();
    });
  });
};

const continueToPlay = () => {
  if (!playStatus.waitingList.length) return;

  audioContext.src = playStatus.waitingList.shift();
  audioContext.play();
};

export function randomNum(n) {
  let value = "";
  for (let i = 0; i < n; i++) {
    value += Math.floor(Math.random() * 10);
  }
  return value;
}

export const random = (len = 8) => {
  return Math.random().toString(36).substr(2, len) + Date.now().toString(36);
};

export const cancellable = (p) => {
  let cancel;

  let promise = new Promise((resolve, reject) => {
    p.then(resolve, reject);
    cancel = () => reject();
  });

  return { promise, cancel };
};

export function convertToMp3(wavDataView, recorder) {
  // 获取wav头信息
  const wav = lamejs.WavHeader.readHeader(wavDataView); // 此处其实可以不用去读wav头信息，毕竟有对应的config配置
  const { channels, sampleRate } = wav;
  const mp3enc = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  // 获取左右通道数据
  const result = recorder.getChannelData();
  const buffer = [];

  const leftData =
    result.left &&
    new Int16Array(result.left.buffer, 0, result.left.byteLength / 2);
  const rightData =
    result.right &&
    new Int16Array(result.right.buffer, 0, result.right.byteLength / 2);
  const remaining = leftData.length + (rightData ? rightData.length : 0);

  const maxSamples = 1152;
  for (let i = 0; i < remaining; i += maxSamples) {
    const left = leftData.subarray(i, i + maxSamples);
    let right = null;
    let mp3buf = null;

    if (channels === 2) {
      right = rightData.subarray(i, i + maxSamples);
      mp3buf = mp3enc.encodeBuffer(left, right);
    } else {
      mp3buf = mp3enc.encodeBuffer(left);
    }

    if (mp3buf.length > 0) {
      buffer.push(mp3buf);
    }
  }

  const enc = mp3enc.flush();

  if (enc.length > 0) {
    buffer.push(enc);
  }

  return new Blob(buffer, { type: "audio/mp3" });
}
