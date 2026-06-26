import { FaceLandmarkPoint } from '../types/faceAnalysis';

export const normalize = (value: number, min: number, max: number): number => {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const distance = (pointA: FaceLandmarkPoint, pointB: FaceLandmarkPoint): number => {
  return Math.sqrt(
    Math.pow(pointB.x - pointA.x, 2) +
    Math.pow(pointB.y - pointA.y, 2) +
    Math.pow((pointB.z || 0) - (pointA.z || 0), 2)
  );
};

export const midpoint = (pointA: FaceLandmarkPoint, pointB: FaceLandmarkPoint): FaceLandmarkPoint => {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
    z: ((pointA.z || 0) + (pointB.z || 0)) / 2,
  };
};
