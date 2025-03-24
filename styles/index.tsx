import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
  },
  bookDetails: {
    marginTop: 20,
    alignItems: "center",
  },
  thumbnail: {
    width: 150,
    height: 200,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  author: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "justify",
  },
  text: {
    marginTop: 20,
    textAlign: "center",
  },
  error: {
    marginTop: 20,
    color: "red",
    textAlign: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
