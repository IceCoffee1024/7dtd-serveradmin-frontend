declare namespace API {
  namespace Devices {
    interface SystemMetricsSnapshot {
      timestamp: string;
      cpuTimes: {
        idleTime: number;
        kernelTime: number;
        userTime: number;
      };
      memoryInfo: {
        totalPhysicalMemory: number;
        availablePhysicalMemory: number;
        usedPercentage: number;
        totalVirtualMemory: number;
        availableVirtualMemory: number;
      };
      diskInfos: {
        name: string;
        driveType: 'Unknown' | 'NoRootDirectory' | 'Removable' | 'Fixed' | 'Network' | 'CDRom' | 'Ram';
        driveFormat: string;
        freeSpace: number;
        totalSize: number;
        usedSize: number;
        rootPath: string;
      }[];
      networkInfos: {
        id: string;
        mac: string;
        name: string;
        trademark: string;
        networkType: 'Unknown';
        speed: number;
        ipAddresses: string[];
        bytesReceived: number;
        bytesSent: number;
      }[];
    }

    interface SystemPlatformInfo {
      deviceModel: string;
      deviceName: string;
      deviceType: string;
      deviceUniqueIdentifier: string;
      operatingSystem: string;
      operatingSystemFamily: string;
      processorCount: number;
      processorFrequency: number;
      processorType: string;
      systemMemorySize: number;
      frameworkVersion: string;
      userName: string;
    }

  }
}
