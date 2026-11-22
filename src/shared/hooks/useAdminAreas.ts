import { useCallback, useState } from "react";
import { adminApi } from "@/config/admin.api";
import type {
  AreaDto,
  CreateAreaDto,
  CreateSupervisorDto,
  SupervisorDto,
  UpdateAreaDto,
  UpdateSupervisorDto,
} from "@shared/types";

export type Area = AreaDto;
export type Supervisor = SupervisorDto;

export interface UseAdminAreasResult {
  areas: AreaDto[];
  supervisors: SupervisorDto[];
  loading: boolean;
  error: Error | null;
  fetchAreas: () => Promise<AreaDto[]>;
  fetchAreaById: (id: string) => Promise<AreaDto>;
  createArea: (dto: CreateAreaDto) => Promise<AreaDto>;
  updateArea: (id: string, dto: UpdateAreaDto) => Promise<AreaDto>;
  deleteArea: (id: string) => Promise<void>;
  fetchSupervisors: () => Promise<SupervisorDto[]>;
  fetchSupervisorById: (id: string) => Promise<SupervisorDto>;
  createSupervisor: (dto: CreateSupervisorDto) => Promise<SupervisorDto>;
  updateSupervisor: (id: string, dto: UpdateSupervisorDto) => Promise<SupervisorDto>;
  deleteSupervisor: (id: string) => Promise<void>;
  assignAreaToSupervisor: (supervisorId: string, areaId: string) => Promise<void>;
  removeAreaFromSupervisor: (supervisorId: string, areaId: string) => Promise<void>;
}

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "object" && error !== null) {
    const value = error as { message?: unknown; Message?: unknown };
    if (typeof value.message === "string") return new Error(value.message);
    if (typeof value.Message === "string") return new Error(value.Message);
  }
  return new Error(fallback);
}

/**
 * Admin Areas and Supervisors API hook.
 *
 * Uses the current endpoints:
 * - /api/admin/areas
 * - /api/admin/supervisors
 * - /api/admin/supervisors/{supervisorId}/areas/{areaId}
 */
export function useAdminAreas(): UseAdminAreasResult {
  const [areas, setAreas] = useState<AreaDto[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAreas = useCallback(async (): Promise<AreaDto[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getAreas();
      setAreas(result);
      return result;
    } catch (cause) {
      const nextError = toError(cause, "Failed to load areas.");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAreaById = useCallback(async (id: string): Promise<AreaDto> => {
    try {
      return await adminApi.getArea(id);
    } catch (cause) {
      throw toError(cause, "Failed to load the area.");
    }
  }, []);

  const createArea = useCallback(async (dto: CreateAreaDto): Promise<AreaDto> => {
    try {
      const created = await adminApi.createArea(dto);
      setAreas((current) => [created, ...current]);
      return created;
    } catch (cause) {
      throw toError(cause, "Failed to create the area.");
    }
  }, []);

  const updateArea = useCallback(
    async (id: string, dto: UpdateAreaDto): Promise<AreaDto> => {
      try {
        const updated = await adminApi.updateArea(id, dto);
        setAreas((current) => current.map((area) => (area.id === id ? updated : area)));
        return updated;
      } catch (cause) {
        throw toError(cause, "Failed to update the area.");
      }
    },
    [],
  );

  const deleteArea = useCallback(async (id: string): Promise<void> => {
    try {
      await adminApi.deleteArea(id);
      setAreas((current) => current.filter((area) => area.id !== id));
    } catch (cause) {
      throw toError(cause, "Failed to delete the area.");
    }
  }, []);

  const fetchSupervisors = useCallback(async (): Promise<SupervisorDto[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.getSupervisors();
      setSupervisors(result);
      return result;
    } catch (cause) {
      const nextError = toError(cause, "Failed to load supervisors.");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSupervisorById = useCallback(async (id: string): Promise<SupervisorDto> => {
    try {
      return await adminApi.getSupervisor(id);
    } catch (cause) {
      throw toError(cause, "Failed to load the supervisor.");
    }
  }, []);

  const createSupervisor = useCallback(
    async (dto: CreateSupervisorDto): Promise<SupervisorDto> => {
      try {
        const created = await adminApi.createSupervisor(dto);
        setSupervisors((current) => [created, ...current]);
        return created;
      } catch (cause) {
        throw toError(cause, "Failed to create the supervisor.");
      }
    },
    [],
  );

  const updateSupervisor = useCallback(
    async (id: string, dto: UpdateSupervisorDto): Promise<SupervisorDto> => {
      try {
        const updated = await adminApi.updateSupervisor(id, dto);
        setSupervisors((current) =>
          current.map((supervisor) => (supervisor.id === id ? updated : supervisor)),
        );
        return updated;
      } catch (cause) {
        throw toError(cause, "Failed to update the supervisor.");
      }
    },
    [],
  );

  const deleteSupervisor = useCallback(async (id: string): Promise<void> => {
    try {
      await adminApi.deleteSupervisor(id);
      setSupervisors((current) => current.filter((supervisor) => supervisor.id !== id));
    } catch (cause) {
      throw toError(cause, "Failed to delete the supervisor.");
    }
  }, []);

  const assignAreaToSupervisor = useCallback(
    async (supervisorId: string, areaId: string): Promise<void> => {
      try {
        await adminApi.assignAreaToSupervisor(supervisorId, areaId);
        // Refreshing the supervisor keeps its nested areas in sync with the API.
        const updated = await adminApi.getSupervisor(supervisorId);
        setSupervisors((current) =>
          current.map((supervisor) => (supervisor.id === supervisorId ? updated : supervisor)),
        );
      } catch (cause) {
        throw toError(cause, "Failed to assign the area to the supervisor.");
      }
    },
    [],
  );

  const removeAreaFromSupervisor = useCallback(
    async (supervisorId: string, areaId: string): Promise<void> => {
      try {
        await adminApi.unassignAreaFromSupervisor(supervisorId, areaId);
        const updated = await adminApi.getSupervisor(supervisorId);
        setSupervisors((current) =>
          current.map((supervisor) => (supervisor.id === supervisorId ? updated : supervisor)),
        );
      } catch (cause) {
        throw toError(cause, "Failed to remove the area from the supervisor.");
      }
    },
    [],
  );

  return {
    areas,
    supervisors,
    loading,
    error,
    fetchAreas,
    fetchAreaById,
    createArea,
    updateArea,
    deleteArea,
    fetchSupervisors,
    fetchSupervisorById,
    createSupervisor,
    updateSupervisor,
    deleteSupervisor,
    assignAreaToSupervisor,
    removeAreaFromSupervisor,
  };
}
