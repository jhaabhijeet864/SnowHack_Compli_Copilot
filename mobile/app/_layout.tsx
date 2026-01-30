import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { RunAnywhere, SDKEnvironment, ModelCategory } from '@runanywhere/core';
import { LlamaCPP } from '@runanywhere/llamacpp';
import { ONNX, ModelArtifactType } from '@runanywhere/onnx';


export const unstable_settings = {
  anchor: '(tabs)',
};

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

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
      console.log("RunAnywhere SDK Initialized");
    };
    init();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
