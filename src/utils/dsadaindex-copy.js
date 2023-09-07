import axios from "axios";

const lamejs = require("lamejs");

function loadAudioFile(url) {
  axios
    .get(url, {
      headers: {
        responseType: "arraybuffer",
      },
    })
    .then((res) => {
      console.log(res, "666");
      return initSound(res);
    });
}

export const audioContext = new AudioContext();
export const globalState = {
  isInChatPage: false,
};

audioContext.addEventListener("sinkchange", () => {
  console.log(audioContext, "audioContext");
  if (
    typeof audioContext.sinkId === "object" &&
    audioContext.sinkId.type === "none"
  ) {
    console.log("Audio changed to not play on any device");
  } else {
    console.log(`Audio output device changed to ${audioContext.sinkId}`);
  }
});

export let source = null;
let audioBuffer = null;

export function stopSound() {
  if (source) {
    source.stop(0); //立即停止
  }
}

function playSound() {
  source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(0); //立即播放
}

function initSound(arrayBuffer) {
  audioContext.decodeAudioData(
    arrayBuffer,
    function (buffer) {
      //解码成功时的回调函数
      audioBuffer = buffer;
      playSound();
    },
    function (e) {
      //解码出错时的回调函数
      console.log("Error decoding file", e);
    }
  );
}

// audioContext.onstopplay = () => (playStatus.playing = false);
// audioContext.onplay = () => (playStatus.playing = true);
// audioContext.onplayend = () => (playStatus.playing = false);
// audioContext.onpauseplay = () => (playStatus.playing = false);

export const clearAudioWaitingList = () => {
  playStatus.waitingList = [];
  playStatus.playing = false;
  stopSound();
  console.log("clear", playStatus);
};

//  audioContext.paused 总是返回true，只能通过自己监听状态
export const playStatus = {
  playing: false,
  waitingList: [],
};
export const playAudio = (src, waiting = false) => {
  const play = () => {
    loadAudioFile(src);
  };

  if (!waiting) {
    play();
  } else {
    console.log("finalContent", playStatus, audioContext.paused);
    if (playStatus.playing) {
      console.log("等待播放");
      playStatus.waitingList.push(src);
      source.offended(continueToPlay);
      source.onended(continueToPlay);
    } else {
      console.log("直接播放");
      play();
    }
  }

  return new Promise((resolve) => {
    resolve();
  });
};

const continueToPlay = () => {
  if (!playStatus.waitingList.length) return;

  loadAudioFile(playStatus.waitingList.shift());
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
