type StorageType = 'session' | 'local';

function getStorageType(type: StorageType) {
  return type === 'session' ? sessionStorage : localStorage;
}

class Storage {
  get(key: string, type: StorageType = 'local') {
    let result = null;
    const storage = getStorageType(type);
    result = storage.getItem(key);
    if (result) {
      try {
        return JSON.parse(result);
      } catch (e) {
        return result;
      }
    }
    return null;
  }

  set(key: string, value: any, type: StorageType = 'local') {
    const storage = getStorageType(type);
    storage.setItem(key, JSON.stringify(value));
  }

  remove(key: string, type: StorageType = 'local') {
    const storage = getStorageType(type);
    storage.removeItem(key);
  }

  clear(type: StorageType = 'local') {
    const storage = getStorageType(type);
    storage.clear();
  }
}

export default new Storage();
