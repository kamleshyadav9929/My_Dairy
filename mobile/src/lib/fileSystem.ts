import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FOLDER_URI_KEY = 'my_dairy_folder_uri';

export const DairyFileSystem = {
  /**
   * Request permission to access/create the 'MyDairy' folder.
   * Returns the URI of the working folder.
   */
  getFolderUri: async (): Promise<string | null> => {
    try {
      if (Platform.OS !== 'android') return null; // SAF is Android only

      // Check if we already have a saved URI
      const savedUri = await AsyncStorage.getItem(FOLDER_URI_KEY);
      
      // Verify if we still have access to this URI
      if (savedUri) {
        try {
          // Attempt to read directory to check permission persistence
          await StorageAccessFramework.readDirectoryAsync(savedUri);
          return savedUri;
        } catch (e) {
            // Permission lost or folder deleted, reset
            console.log('Lost access to folder, requesting again...');
        }
      }

      // Request Permission
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        let uri = permissions.directoryUri;
        
        // We can't strictly 'create' MyDairy inside the granted folder with SAF easily if the user selected root.
        // But usually, we ask user to select/create a folder.
        // Let's assume the user selected the folder they want to use.
        
        await AsyncStorage.setItem(FOLDER_URI_KEY, uri);
        return uri;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      Alert.alert('Permission Error', 'Failed to access storage.');
    }
    return null;
  },

  /**
   * clear stored URI to force re-prompt
   */
  resetFolderAccess: async () => {
    await AsyncStorage.removeItem(FOLDER_URI_KEY);
  },

  /**
   * Save content (base64 or string) to a file in the MyDairy folder
   */
  saveFile: async (filename: string, content: string, mimeType: string = 'application/pdf') => {
    try {
      const folderUri = await DairyFileSystem.getFolderUri();
      if (!folderUri) {
        Alert.alert('Permission Required', 'Please select a folder to save your slips.');
        return false;
      }

      // Create file
      const fileUri = await StorageAccessFramework.createFileAsync(folderUri, filename, mimeType);
      
      // Write content
      await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.Base64 });
      
      return true;
    } catch (error) {
      console.error('File save failed:', error);
      Alert.alert('Save Failed', 'Could not save the file.');
      return false;
    }
  }
};
