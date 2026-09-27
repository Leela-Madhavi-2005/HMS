import { useEffect, useState } from "react";
import socket from "../api/socket";
import { useAuth } from "../contexts/AuthContext";

export default function useSocket() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (!currentUser) {
      return;
    }

    const joinRooms = () => {
      if (!currentUser) return;
      const role = currentUser.role?.toLowerCase();
      if (role) {
        socket.emit("join_room", { room: `role_${role}` });
        socket.emit("join_room", { room: "all_roles" });
      }
      if (currentUser.uid) {
        socket.emit("join_room", { room: `user_${currentUser.uid}` });
      }
    };

    const addNotification = (message, appointmentId = null) => {
      setNotifications((prev) => [
        { id: Date.now() + Math.random(), message, time: new Date().toISOString(), appointmentId },
        ...prev.slice(0, 9),
      ]);
    };

    socket.on("connect", joinRooms);
    joinRooms();

    socket.on("notification", (payload) => {
      addNotification(payload.message || "New system notification", payload.appointmentId);
    });

    socket.on("appointment:update", (payload) => {
      addNotification(`Appointment updated: ${payload.message}`, payload.appointmentId);
    });

    socket.on("prescription:created", (payload) => {
      addNotification(`New prescription created for ${payload.patientName || "a patient"}`);
    });

    socket.on("bill:generated", (payload) => {
      addNotification(`New bill generated: ${payload.amount ? `$${payload.amount}` : "$0"}`);
    });

    socket.on("doctor:availabilityChanged", (payload) => {
      addNotification(`Doctor availability changed: ${payload.doctorName || "Unknown"}`);
    });

    return () => {
      socket.off("connect", joinRooms);
      socket.off("notification");
      socket.off("appointment:update");
      socket.off("prescription:created");
      socket.off("bill:generated");
      socket.off("doctor:availabilityChanged");
    };
  }, [currentUser]);

  const clearNotifications = () => setNotifications([]);

  return { notifications, setNotifications, clearNotifications, socket };
}