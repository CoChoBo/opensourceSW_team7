// components/ExpiryAlertModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ExpiryAlertModal({
  visible,
  count,
  onClose,
  onGoIngredients,
}: {
  visible: boolean;
  count: number;
  onClose: () => void;
  onGoIngredients: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Ionicons name="alert-circle" size={48} color="#fbbf24" />

          <Text style={styles.title}>유통기한 임박!</Text>

          <Text style={styles.subtitle}>
            유통기한이 임박한 식재료가{" "}
            <Text style={{ color: "#f87171", fontWeight: "bold" }}>{count}</Text>
            개 있어요
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>확인</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.goBtn]} onPress={onGoIngredients}>
              <Text style={styles.goText}>식재료 관리하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#1e293b",
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  subtitle: {
    marginTop: 10,
    color: "#cbd5e1",
    fontSize: 15,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 25,
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#475569",
  },
  goBtn: {
    backgroundColor: "#3b82f6",
  },
  cancelText: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
  },
  goText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
