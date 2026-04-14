declare namespace API {
  namespace Devices {
    interface CpuTimes {
      idleTime: number;
      kernelTime: number;
      userTime: number;
    }

    interface MemoryInfo {
      totalPhysicalMemory: number;
      availablePhysicalMemory: number;
      usedPercentage: number;
      totalVirtualMemory: number;
      availableVirtualMemory: number;
    }

    interface DiskInfo {
      name: string;
      driveType: 'Unknown' | 'NoRootDirectory' | 'Removable' | 'Fixed' | 'Network' | 'CDRom' | 'Ram';
      driveFormat: string;
      freeSpace: number;
      totalSize: number;
      usedSize: number;
      rootPath: string | null;
    }

    interface NetworkInfo {
      id: string;
      mac: string;
      name: string;
      trademark: string;
      networkType: string;
      speed: number;
      ipAddresses: string[];
      bytesReceived: number;
      bytesSent: number;
    }

    interface SystemMetricsSnapshot {
      timestamp: string;
      cpuTimes: CpuTimes | null;
      memoryInfo: MemoryInfo | null;
      diskInfos: DiskInfo[];
      networkInfos: NetworkInfo[];
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
