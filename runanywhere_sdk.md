""​
RunAnywhere AI Studio App
You MUST use the “RunAnywhere AI Studio” app to run your React Native app. This is a custom fork of Expo Go that includes the native libraries required for the RunAnywhere SDK.
Standard Expo Go does NOT include RunAnywhere native modules
The AI Studio app contains: LlamaCPP (LLM), ONNX Runtime (STT/TTS), NativeAudioModule
Your JS bundle connects to Metro, but runs inside AI Studio which provides the native layer
​
Quick Start
Package Version Compatibility: Since your app runs inside AI Studio (not a standalone build), native libraries must match pre-installed versions. Most critically: use react-native-reanimated@^3.16.0 — NOT 4.x. See Package Compatibility section for details.
​
1. Install Dependencies
Copy
Ask AI
# Core RunAnywhere SDK packages
npm install @runanywhere/core @runanywhere/llamacpp @runanywhere/onnx

# Required: Nitro Modules (native bridge)
npm install react-native-nitro-modules

# Required: File system for model downloads (CRITICAL - without this, models cannot download)
npm install react-native-fs@^2.20.0 react-native-zip-archive@^6.1.0

# Navigation
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-safe-area-context react-native-screens

# Optional: Animations (CRITICAL: use 3.x, NOT 4.x)
npm install react-native-reanimated@^3.16.0 react-native-gesture-handler@^2.20.2

# Optional: UI
npm install react-native-linear-gradient

react-native-fs and react-native-zip-archive are required for model downloads. Without them, you will see: ERROR: react-native-fs not installed - cannot download models
​
2. Initialize SDK (App.tsx)
Copy
Ask AI
import React, { useEffect } from 'react';
import { RunAnywhere, SDKEnvironment } from '@runanywhere/core';

const App = () => {
  useEffect(() => {
    const init = async () => {
      // 1. Initialize SDK
      await RunAnywhere.initialize({
        environment: SDKEnvironment.Development,
      });

      // 2. Register backends
      const { LlamaCPP } = await import('@runanywhere/llamacpp');
      const { ONNX } = await import('@runanywhere/onnx');
      LlamaCPP.register();
      ONNX.register();

      // 3. Register models
      await registerModels();
    };
    init();
  }, []);

  return <YourApp />;
};

​
3. Register Models
Copy
Ask AI
import { ModelCategory } from '@runanywhere/core'
import { LlamaCPP } from '@runanywhere/llamacpp'
import { ONNX, ModelArtifactType } from '@runanywhere/onnx'

const MODEL_IDS = {
  llm: 'lfm2-350m-q8_0',
  stt: 'sherpa-onnx-whisper-tiny.en',
  tts: 'vits-piper-en_US-lessac-medium',
}

async function registerModels() {
  // LLM Model
  await LlamaCPP.addModel({
    id: MODEL_IDS.llm,
    name: 'LiquidAI LFM2 350M',
    url: 'https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q8_0.gguf',
    memoryRequirement: 400_000_000,
  })

  // STT Model (Whisper)
  await ONNX.addModel({
    id: MODEL_IDS.stt,
    name: 'Whisper Tiny EN',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/sherpa-onnx-whisper-tiny.en.tar.gz',
    modality: ModelCategory.SpeechRecognition,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 75_000_000,
  })

  // TTS Model (Piper)
  await ONNX.addModel({
    id: MODEL_IDS.tts,
    name: 'Piper TTS EN-US',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-en_US-lessac-medium.tar.gz',
    modality: ModelCategory.SpeechSynthesis,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 65_000_000,
  })
}

​
API Reference
​
Model Management
Copy
Ask AI
import { RunAnywhere } from '@runanywhere/core'

// Check if downloaded
const info = await RunAnywhere.getModelInfo('model-id')
const isDownloaded = !!info?.localPath

// Download with progress
await RunAnywhere.downloadModel('model-id', (progress) => {
  console.log(`${progress.progress * 100}%`) // progress.progress is 0-1
})

// Load models
const info = await RunAnywhere.getModelInfo('model-id')
await RunAnywhere.loadModel(info.localPath) // LLM
await RunAnywhere.loadSTTModel(info.localPath, 'whisper') // STT
await RunAnywhere.loadTTSModel(info.localPath, 'piper') // TTS

// Unload models
await RunAnywhere.unloadModel() // LLM
await RunAnywhere.unloadSTTModel() // STT
await RunAnywhere.unloadTTSModel() // TTS

​
LLM Chat (Streaming)
Copy
Ask AI
import { RunAnywhere } from '@runanywhere/core'

// Stream generation (recommended for chat UI)
const streamResult = await RunAnywhere.generateStream(prompt, {
  maxTokens: 256,
  temperature: 0.8,
})

// Iterate tokens as they arrive
let response = ''
for await (const token of streamResult.stream) {
  response += token
  updateUI(response) // Update UI in real-time
}

// Get final metrics
const result = await streamResult.result
console.log(result.performanceMetrics.tokensPerSecond)

// Cancel generation
streamResult.cancel()

​
Speech-to-Text (STT)
Copy
Ask AI
import { RunAnywhere } from '@runanywhere/core'

// Check if loaded
const isLoaded = await RunAnywhere.isSTTModelLoaded()

// Transcribe base64 audio (from NativeAudioModule)
const result = await RunAnywhere.transcribe(audioBase64, {
  sampleRate: 16000,
  language: 'en',
})
console.log(result.text)

​
Text-to-Speech (TTS)
Copy
Ask AI
import { RunAnywhere } from '@runanywhere/core'

// Synthesize speech
const result = await RunAnywhere.synthesize(text, {
  voice: 'default',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
})

// result.audio = base64 float32 PCM
// result.sampleRate = 22050
// result.duration = seconds

// Convert to WAV file for playback
const wavPath = await RunAnywhere.Audio.createWavFromPCMFloat32(
  result.audio,
  result.sampleRate || 22050
)

​
Voice Pipeline (Full Agent)
Copy
Ask AI
import { RunAnywhere, VoiceSessionEvent } from '@runanywhere/core'

const session = await RunAnywhere.startVoiceSession(
  {
    agentConfig: {
      llmModelId: 'lfm2-350m-q8_0',
      sttModelId: 'sherpa-onnx-whisper-tiny.en',
      ttsModelId: 'vits-piper-en_US-lessac-medium',
      systemPrompt: 'You are a helpful voice assistant.',
      generationOptions: { maxTokens: 150, temperature: 0.7 },
    },
    enableVAD: true,
    vadSensitivity: 0.5,
    speechTimeout: 3000,
  },
  (event: VoiceSessionEvent) => {
    switch (event.type) {
      case 'transcriptionComplete':
        console.log('User:', event.data?.transcript)
        break
      case 'generationComplete':
        console.log('AI:', event.data?.response)
        break
      case 'synthesisComplete':
        // event.data?.audio contains response audio
        break
      case 'error':
        console.error(event.data?.error)
        break
    }
  }
)

// Stop session
await session.stop()

​
Complete package.json
Copy
Ask AI
{
  "dependencies": {
    "@react-navigation/native": "^7.1.24",
    "@react-navigation/native-stack": "^7.8.5",
    "@runanywhere/core": "^0.17.4",
    "@runanywhere/llamacpp": "^0.17.4",
    "@runanywhere/onnx": "^0.17.4",
    "react": "19.2.0",
    "react-native": "0.83.1",
    "react-native-fs": "^2.20.0",
    "react-native-gesture-handler": "^2.20.2",
    "react-native-linear-gradient": "^2.8.3",
    "react-native-nitro-modules": "^0.31.10",
    "react-native-reanimated": "^3.16.0",
    "react-native-safe-area-context": "~5.6.2",
    "react-native-screens": "~4.19.0",
    "react-native-zip-archive": "^6.1.0"
  }
}

react-native-fs and react-native-zip-archive are peer dependencies of the RunAnywhere SDK. They must be installed in your app for model downloads to work. - react-native-reanimated must be ^3.16.0 (NOT 4.x) to match the native code in AI Studio.
​
Project Structure
Copy
Ask AI
src/
├── App.tsx                 # SDK init + navigation
├── services/
│   └── ModelService.tsx    # Model state management (Context)
├── screens/
│   ├── ChatScreen.tsx      # LLM chat with streaming
│   ├── SpeechToTextScreen.tsx
│   ├── TextToSpeechScreen.tsx
│   └── VoicePipelineScreen.tsx
├── theme/
│   └── colors.ts
└── navigation/
    └── types.ts

​
ModelService Pattern (React Context)
Use this pattern to manage model download/load state across your app:
Copy
Ask AI
// src/services/ModelService.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { RunAnywhere, ModelCategory } from '@runanywhere/core';
import { LlamaCPP } from '@runanywhere/llamacpp';
import { ONNX, ModelArtifactType } from '@runanywhere/onnx';

const MODEL_IDS = {
  llm: 'lfm2-350m-q8_0',
  stt: 'sherpa-onnx-whisper-tiny.en',
  tts: 'vits-piper-en_US-lessac-medium',
};

interface ModelState {
  isLLMLoaded: boolean;
  isSTTLoaded: boolean;
  isTTSLoaded: boolean;
  isLLMDownloading: boolean;
  isSTTDownloading: boolean;
  isTTSDownloading: boolean;
  llmDownloadProgress: number;
  sttDownloadProgress: number;
  ttsDownloadProgress: number;
  downloadAndLoadLLM: () => Promise<void>;
  downloadAndLoadSTT: () => Promise<void>;
  downloadAndLoadTTS: () => Promise<void>;
}

const ModelContext = createContext<ModelState | null>(null);

export const useModelService = () => {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error('useModelService must be inside ModelServiceProvider');
  return ctx;
};

export const ModelServiceProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isLLMLoaded, setIsLLMLoaded] = useState(false);
  const [isSTTLoaded, setIsSTTLoaded] = useState(false);
  const [isTTSLoaded, setIsTTSLoaded] = useState(false);
  const [isLLMDownloading, setIsLLMDownloading] = useState(false);
  const [isSTTDownloading, setIsSTTDownloading] = useState(false);
  const [isTTSDownloading, setIsTTSDownloading] = useState(false);
  const [llmDownloadProgress, setLLMDownloadProgress] = useState(0);
  const [sttDownloadProgress, setSTTDownloadProgress] = useState(0);
  const [ttsDownloadProgress, setTTSDownloadProgress] = useState(0);

  const downloadAndLoadLLM = useCallback(async () => {
    const info = await RunAnywhere.getModelInfo(MODEL_IDS.llm);
    if (!info?.localPath) {
      setIsLLMDownloading(true);
      await RunAnywhere.downloadModel(MODEL_IDS.llm, (p) => setLLMDownloadProgress(p.progress * 100));
      setIsLLMDownloading(false);
    }
    const updated = await RunAnywhere.getModelInfo(MODEL_IDS.llm);
    await RunAnywhere.loadModel(updated!.localPath!);
    setIsLLMLoaded(true);
  }, []);

  const downloadAndLoadSTT = useCallback(async () => {
    const info = await RunAnywhere.getModelInfo(MODEL_IDS.stt);
    if (!info?.localPath) {
      setIsSTTDownloading(true);
      await RunAnywhere.downloadModel(MODEL_IDS.stt, (p) => setSTTDownloadProgress(p.progress * 100));
      setIsSTTDownloading(false);
    }
    const updated = await RunAnywhere.getModelInfo(MODEL_IDS.stt);
    await RunAnywhere.loadSTTModel(updated!.localPath!, 'whisper');
    setIsSTTLoaded(true);
  }, []);

  const downloadAndLoadTTS = useCallback(async () => {
    const info = await RunAnywhere.getModelInfo(MODEL_IDS.tts);
    if (!info?.localPath) {
      setIsTTSDownloading(true);
      await RunAnywhere.downloadModel(MODEL_IDS.tts, (p) => setTTSDownloadProgress(p.progress * 100));
      setIsTTSDownloading(false);
    }
    const updated = await RunAnywhere.getModelInfo(MODEL_IDS.tts);
    await RunAnywhere.loadTTSModel(updated!.localPath!, 'piper');
    setIsTTSLoaded(true);
  }, []);

  return (
    <ModelContext.Provider value={{
      isLLMLoaded, isSTTLoaded, isTTSLoaded,
      isLLMDownloading, isSTTDownloading, isTTSDownloading,
      llmDownloadProgress, sttDownloadProgress, ttsDownloadProgress,
      downloadAndLoadLLM, downloadAndLoadSTT, downloadAndLoadTTS,
    }}>
      {children}
    </ModelContext.Provider>
  );
};

export async function registerModels() {
  await LlamaCPP.addModel({
    id: MODEL_IDS.llm,
    name: 'LiquidAI LFM2 350M',
    url: 'https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q8_0.gguf',
    memoryRequirement: 400_000_000,
  });
  await ONNX.addModel({
    id: MODEL_IDS.stt,
    name: 'Whisper Tiny EN',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/sherpa-onnx-whisper-tiny.en.tar.gz',
    modality: ModelCategory.SpeechRecognition,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 75_000_000,
  });
  await ONNX.addModel({
    id: MODEL_IDS.tts,
    name: 'Piper TTS EN-US',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-en_US-lessac-medium.tar.gz',
    modality: ModelCategory.SpeechSynthesis,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 65_000_000,
  });
}

​
ChatScreen Example
Copy
Ask AI
// src/screens/ChatScreen.tsx
import React, { useState, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';
import { RunAnywhere } from '@runanywhere/core';
import { useModelService } from '../services/ModelService';

export const ChatScreen = () => {
  const { isLLMLoaded, downloadAndLoadLLM, isLLMDownloading, llmDownloadProgress } = useModelService();
  const [messages, setMessages] = useState<{text: string; isUser: boolean}[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const cancelRef = useRef<(() => void) | null>(null);

  if (!isLLMLoaded) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <Text>LLM Model Required</Text>
        {isLLMDownloading ? (
          <Text>Downloading: {llmDownloadProgress.toFixed(0)}%</Text>
        ) : (
          <TouchableOpacity onPress={downloadAndLoadLLM}>
            <Text>Download & Load</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const send = async () => {
    if (!input.trim() || isGenerating) return;
    const prompt = input.trim();
    setMessages(m => [...m, { text: prompt, isUser: true }]);
    setInput('');
    setIsGenerating(true);
    setCurrentResponse('');

    try {
      const stream = await RunAnywhere.generateStream(prompt, { maxTokens: 256, temperature: 0.8 });
      cancelRef.current = stream.cancel;
      let response = '';
      for await (const token of stream.stream) {
        response += token;
        setCurrentResponse(response);
      }
      setMessages(m => [...m, { text: response, isUser: false }]);
      setCurrentResponse('');
    } catch (e) {
      setMessages(m => [...m, { text: `Error: ${e}`, isUser: false }]);
    }
    setIsGenerating(false);
  };

  return (
    <View style={{flex:1}}>
      <FlatList
        data={[...messages, ...(isGenerating ? [{text: currentResponse || '...', isUser: false}] : [])]}
        renderItem={({item}) => (
          <View style={{padding:8, alignSelf: item.isUser ? 'flex-end' : 'flex-start'}}>
            <Text>{item.text}</Text>
          </View>
        )}
        keyExtractor={(_, i) => i.toString()}
      />
      <View style={{flexDirection:'row', padding:8}}>
        <TextInput
          style={{flex:1, borderWidth:1, borderRadius:8, padding:8}}
          value={input}
          onChangeText={setInput}
          placeholder="Type message..."
        />
        <TouchableOpacity onPress={isGenerating ? () => cancelRef.current?.() : send} style={{padding:8}}>
          <Text>{isGenerating ? 'Stop' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

​
STT Screen Example
Copy
Ask AI
// src/screens/SpeechToTextScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { RunAnywhere } from '@runanywhere/core';
import { useModelService } from '../services/ModelService';

const { NativeAudioModule } = NativeModules;

export const SpeechToTextScreen = () => {
  const { isSTTLoaded, downloadAndLoadSTT } = useModelService();
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');

  if (!isSTTLoaded) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <TouchableOpacity onPress={downloadAndLoadSTT}>
          <Text>Download & Load STT Model</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startRecording = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    }
    await NativeAudioModule.startRecording();
    setIsRecording(true);
  };

  const stopAndTranscribe = async () => {
    const result = await NativeAudioModule.stopRecording();
    setIsRecording(false);

    const transcribeResult = await RunAnywhere.transcribe(result.audioBase64, {
      sampleRate: 16000,
      language: 'en',
    });
    setTranscription(transcribeResult.text || '(No speech detected)');
  };

  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
      <Text>{transcription}</Text>
      <TouchableOpacity onPress={isRecording ? stopAndTranscribe : startRecording}>
        <Text>{isRecording ? 'Stop & Transcribe' : 'Start Recording'}</Text>
      </TouchableOpacity>
    </View>
  );
};

​
TTS Screen Example
Copy
Ask AI
// src/screens/TextToSpeechScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, NativeModules } from 'react-native';
import { RunAnywhere } from '@runanywhere/core';
import { useModelService } from '../services/ModelService';

const { NativeAudioModule } = NativeModules;

export const TextToSpeechScreen = () => {
  const { isTTSLoaded, downloadAndLoadTTS } = useModelService();
  const [text, setText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  if (!isTTSLoaded) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <TouchableOpacity onPress={downloadAndLoadTTS}>
          <Text>Download & Load TTS Model</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const synthesize = async () => {
    if (!text.trim()) return;
    setIsSynthesizing(true);

    const result = await RunAnywhere.synthesize(text, { rate: 1.0, pitch: 1.0, volume: 1.0 });
    const wavPath = await RunAnywhere.Audio.createWavFromPCMFloat32(result.audio, result.sampleRate || 22050);

    if (NativeAudioModule) {
      await NativeAudioModule.playAudio(wavPath);
    }
    setIsSynthesizing(false);
  };

  return (
    <View style={{flex:1, padding:16}}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Enter text..."
        multiline
        style={{borderWidth:1, borderRadius:8, padding:8, minHeight:100}}
      />
      <TouchableOpacity onPress={synthesize} disabled={isSynthesizing}>
        <Text>{isSynthesizing ? 'Synthesizing...' : 'Speak'}</Text>
      </TouchableOpacity>
    </View>
  );
};

​
Theme Colors
Copy
Ask AI
// src/theme/colors.ts
export const AppColors = {
  primaryDark: '#0A0E1A',
  primaryMid: '#141B2D',
  surfaceCard: '#1C2438',
  surfaceElevated: '#242F4A',
  accentCyan: '#00D9FF',
  accentViolet: '#8B5CF6',
  accentPink: '#EC4899',
  accentGreen: '#10B981',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  error: '#EF4444',
}

​
Navigation Types
Copy
Ask AI
// src/navigation/types.ts
export type RootStackParamList = {
  Home: undefined
  Chat: undefined
  SpeechToText: undefined
  TextToSpeech: undefined
  VoicePipeline: undefined
}

​
Model URLs Reference
Model	ID	URL
LLM (LFM2 350M)	lfm2-350m-q8_0	https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q8_0.gguf
STT (Whisper)	sherpa-onnx-whisper-tiny.en	https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/sherpa-onnx-whisper-tiny.en.tar.gz
TTS (Piper)	vits-piper-en_US-lessac-medium	https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-en_US-lessac-medium.tar.gz
​
API Quick Reference
Action	Code
Initialize SDK	await RunAnywhere.initialize({ environment: SDKEnvironment.Development })
Register LLM backend	LlamaCPP.register()
Register ONNX backend	ONNX.register()
Add LLM model	await LlamaCPP.addModel({ id, name, url, memoryRequirement })
Add STT/TTS model	await ONNX.addModel({ id, name, url, modality, artifactType, memoryRequirement })
Get model info	await RunAnywhere.getModelInfo(modelId) -> { localPath }
Download model	await RunAnywhere.downloadModel(modelId, (p) => p.progress)
Load LLM	await RunAnywhere.loadModel(localPath)
Load STT	await RunAnywhere.loadSTTModel(localPath, 'whisper')
Load TTS	await RunAnywhere.loadTTSModel(localPath, 'piper')
Stream LLM	await RunAnywhere.generateStream(prompt, { maxTokens, temperature })
Transcribe	await RunAnywhere.transcribe(audioBase64, { sampleRate: 16000, language: 'en' })
Synthesize	await RunAnywhere.synthesize(text, { rate, pitch, volume })
Convert to WAV	await RunAnywhere.Audio.createWavFromPCMFloat32(base64Audio, sampleRate)
Voice session	await RunAnywhere.startVoiceSession(config, eventCallback)
Unload LLM	await RunAnywhere.unloadModel()
Unload STT	await RunAnywhere.unloadSTTModel()
Unload TTS	await RunAnywhere.unloadTTSModel()
​
NativeAudioModule (from AI Studio)
The NativeAudioModule is provided by the RunAnywhere AI Studio app for audio recording/playback:
Copy
Ask AI
import { NativeModules } from 'react-native'
const { NativeAudioModule } = NativeModules

// Recording
await NativeAudioModule.startRecording()
const result = await NativeAudioModule.stopRecording()
// result.audioBase64 = base64 PCM audio
// result.fileSize = bytes

// Playback
await NativeAudioModule.playAudio(wavFilePath)
await NativeAudioModule.stopPlayback()

// Audio level (during recording)
const { level } = await NativeAudioModule.getAudioLevel()

​
Package Compatibility
Since your app runs inside the RunAnywhere AI Studio app (a custom Expo fork), any native libraries you use must match the versions pre-installed in AI Studio. Version mismatches will cause runtime errors.
​
react-native-reanimated
The RunAnywhere AI Studio app includes Reanimated 3.x. You CANNOT use Reanimated 4.x as it has breaking native changes.
Copy
Ask AI
# CORRECT - Compatible with AI Studio
npm install react-native-reanimated@^3.16.0

# WRONG - Will cause native module errors
npm install react-native-reanimated@^4.0.0

If you see errors like:
ReanimatedUIManager native module not found
_ReanimatedModule or ReanimatedCommitHook errors
NativeReanimated undefined errors
"Reanimated 2 failed to create a worklet" or worklet-related crashes
Solution: Downgrade to Reanimated 3.x:
Copy
Ask AI
npm uninstall react-native-reanimated
npm install react-native-reanimated@^3.16.0

​
Other Native Libraries
The same principle applies to any library with native code. If a library requires native compilation (has iOS/Android native code), you must use the version that matches what’s bundled in AI Studio.Libraries bundled in AI Studio (use these versions):
Library	Version	Notes
react-native-reanimated	^3.16.0	NOT 4.x
react-native-gesture-handler	^2.x	Standard Expo version
react-native-safe-area-context	~5.6.2	Standard Expo version
react-native-screens	~4.19.0	Standard Expo version
Pure JS libraries (any version is fine):
@react-navigation/* packages
UI libraries without native code (tailwind, styling)
State management (zustand, redux, mobx)
API clients, utilities
​
Troubleshooting
Issue	Solution
”Native module not found”	You must run in RunAnywhere AI Studio, not Expo Go
”ReanimatedUIManager” / “NativeReanimated” errors	You’re using Reanimated 4.x - downgrade to ^3.16.0 (see Package Compatibility section)
“react-native-fs not installed - cannot download models”	Install required dependencies: npm install react-native-fs@^2.20.0 react-native-zip-archive@^6.1.0
”[FileSystem] react-native-fs not installed” warning	Same as above - these packages are required for model downloads
Model download fails	Check internet, ensure sufficient storage
Out of memory	Use smaller model, unload unused models first
STT returns empty	Ensure 16kHz sample rate, speak clearly
TTS audio not playing	Use createWavFromPCMFloat32 to convert first""