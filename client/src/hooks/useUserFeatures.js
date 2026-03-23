import { useContext } from 'react';
import { AuthContext } from '../components/AuthContext';

/**
 * Custom hook to access the current user's available features.
 * 
 * Usage:
 *   const { hasFeature, features, isFeatureVisible } = useUserFeatures();
 *   
 *   if (hasFeature('add_camera')) {
 *     // Show add camera button
 *   }
 */
export const useUserFeatures = () => {
  const { features } = useContext(AuthContext);

  /**
   * Check if a specific feature is visible to the current user.
   * @param {string} featureKey - The feature key (e.g., 'add_camera')
   * @returns {boolean} True if feature is visible, false otherwise
   */
  const hasFeature = (featureKey) => {
    if (!features || typeof features !== 'object') {
      return false;
    }
    return features[featureKey] === true;
  };

  /**
   * Check if user has ANY of the specified features.
   * @param {...string} featureKeys - One or more feature keys to check
   * @returns {boolean} True if user has at least one feature
   */
  const hasAnyFeature = (...featureKeys) => {
    if (!features || typeof features !== 'object') {
      return false;
    }
    return featureKeys.some(key => features[key] === true);
  };

  /**
   * Check if user has ALL of the specified features.
   * @param {...string} featureKeys - One or more feature keys to check
   * @returns {boolean} True if user has all features
   */
  const hasAllFeatures = (...featureKeys) => {
    if (!features || typeof features !== 'object') {
      return false;
    }
    return featureKeys.every(key => features[key] === true);
  };

  /**
   * Get all visible features for the current user.
   * @returns {Set<string>} Set of feature keys that are visible
   */
  const getVisibleFeatures = () => {
    if (!features || typeof features !== 'object') {
      return new Set();
    }
    return new Set(
      Object.entries(features)
        .filter(([, isVisible]) => isVisible === true)
        .map(([key]) => key)
    );
  };

  /**
   * Get all hidden features for the current user.
   * @returns {Set<string>} Set of feature keys that are NOT visible
   */
  const getHiddenFeatures = () => {
    if (!features || typeof features !== 'object') {
      return new Set();
    }
    return new Set(
      Object.entries(features)
        .filter(([, isVisible]) => isVisible !== true)
        .map(([key]) => key)
    );
  };

  return {
    features, // Raw features object
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    getVisibleFeatures,
    getHiddenFeatures,
  };
};
