import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { toast } from "sonner";
import * as faceapi from "face-api.js";

export interface ProctorRecorderHandle {
  start: () => void;
  stop: () => void;
}

interface ProctorRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onViolation?: (type: string) => void;
}

const ProctorRecorder = forwardRef<ProctorRecorderHandle, ProctorRecorderProps>(
  ({ onRecordingComplete, onViolation }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // Load face-api.js models on mount
    useEffect(() => {
      const loadModels = async () => {
        const MODEL_URL = "/models"; // Place models in public/models
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      };
      loadModels();
    }, []);

    // Face detection and gaze tracking
    useEffect(() => {
      let intervalId: NodeJS.Timeout;
      if (modelsLoaded && isRecording && videoRef.current) {
        intervalId = setInterval(async () => {
          if (!videoRef.current) return;
          const detections = await faceapi
            .detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 160,
                scoreThreshold: 0.2,
              })
            )
            .withFaceLandmarks(true);
          if (detections.length === 0) {
            if (onViolation) onViolation("no_face");
          } else if (detections.length > 1) {
            if (onViolation) onViolation("multiple_faces");
          } else {
            // Gaze tracking: check if user is looking far away (not just a little)
            const landmarks = detections[0].landmarks;
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();
            const nose = landmarks.getNose();
            // Calculate the center X of the eyes and the nose tip X
            const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
            const noseTipX = nose[3].x; // nose[3] is usually the tip
            // Calculate the horizontal offset (positive = looking right, negative = left)
            const offset = noseTipX - eyeCenterX;
            // Only warn if the offset is large (e.g., > 25 pixels)
            if (Math.abs(offset) > 25) {
              if (onViolation) onViolation("gaze_away");
            }
          }
        }, 1000);
      }
      return () => clearInterval(intervalId);
    }, [modelsLoaded, isRecording, onViolation]);

    // Expose start/stop to parent
    useImperativeHandle(ref, () => ({
      start: () => {
        startRecording();
      },
      stop: () => {
        stopRecording();
      },
    }));

    // Violation detection
    useEffect(() => {
      const handleBlur = () => {
        if (onViolation) onViolation("window_blur");
      };
      const handleVisibility = () => {
        if (document.hidden && onViolation) onViolation("tab_hidden");
      };
      window.addEventListener("blur", handleBlur);
      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
        window.removeEventListener("blur", handleBlur);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }, [onViolation]);

    const startRecording = async () => {
      if (isRecording) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9,opus",
        });

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: "video/webm",
          });
          onRecordingComplete(blob);

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
              track.stop();
            });
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        toast.error(
          "Failed to access webcam. Please ensure you have granted camera permissions."
        );
        if (onViolation) onViolation("webcam_denied");
      }
    };

    const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    };

    return (
      <div className="fixed bottom-4 right-4 z-50">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-48 h-36 rounded-lg shadow-lg border-2 border-red-500 transition-opacity duration-300 ${
            isRecording ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        {isRecording && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            Recording
          </div>
        )}
      </div>
    );
  }
);

export default ProctorRecorder;
