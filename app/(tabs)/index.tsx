import React from "react-native";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  View,
  Text,
  Button,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useState } from "react";
import { homeStyles } from "@/styles";
import { API_KEY, BOOK_BASE_URL, OCR_BASE_URL } from "@env";

export default function HomeScreen() {
  const [image, setImage] = useState("");
  const [bookDetails, setBookDetails] = useState({
    title: "",
    authors: "",
    description: "",
    openLibraryId: "",
    firstPublishYear: "",
    isbn: "",
    coverUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "We need camera permissions to scan book covers.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  const resetState = () => {
    setImage("");
    setBookDetails({
      title: "",
      authors: "",
      description: "",
      coverUrl: "",
      openLibraryId: "",
      firstPublishYear: "",
      isbn: "",
    });
    setOcrText("");
    setError("");
  };

  const pickImage = useCallback(async () => {
    resetState();
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.1, // Adjust quality to reduce image size to approximately 1024 KB
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  }, []);

  const processImage = useCallback(async (imageUri: string) => {
    setLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const ocrSpaceApiKey = API_KEY; // Replace with your OCR.space API key
      const ocrSpaceUrl = OCR_BASE_URL; // OCR.space API URL

      const formData = new FormData();
      formData.append("apikey", ocrSpaceApiKey);
      formData.append("base64Image", `data:image/jpeg;base64,${base64}`); // Ensure the correct content type
      formData.append("language", "eng"); // You can change the language

      const ocrResponse = await axios.post(ocrSpaceUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("ocrResponse", ocrResponse);
      if (
        ocrResponse.data.ParsedResults &&
        ocrResponse.data.ParsedResults.length > 0
      ) {
        const parsedText = ocrResponse.data.ParsedResults[0].ParsedText;
        setOcrText(`${parsedText}`);
        debouncedFetchBookDetails(`${parsedText}`);
      } else {
        setError("Could not extract text from the image.");
      }
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Failed to process image.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookDetails = useCallback(async (searchText: string) => {
    setImage("");
    setLoading(true);

    try {
      const openLibraryUrl = `${BOOK_BASE_URL}?q=${searchText?.toLowerCase()}`;
      const response = await axios.get(openLibraryUrl);
      const items = response.data.docs;

      if (items && items.length > 0) {
        const book = items[0];

        const details = {
          title: book.title,
          authors: book.author_name
            ? book.author_name.join(", ")
            : "Unknown Author",
          isbn: book.isbn ? book.isbn[0] : "",
          coverUrl: "",
          openLibraryId: book.key,
          firstPublishYear: book.first_publish_year,
          description: book.description || "No description available",
        };

        if (details.isbn) {
          details.coverUrl = `https://covers.openlibrary.org/b/isbn/${details.isbn}-M.jpg`;
        } else if (details.openLibraryId) {
          const workId = details.openLibraryId.replace("/works/", "");
          const coverIDResponse = await fetch(
            `https://openlibrary.org/works/${workId}.json`
          );
          if (coverIDResponse.ok) {
            const coverIDData = await coverIDResponse.json();
            if (coverIDData.covers && coverIDData.covers.length > 0) {
              details.coverUrl = `https://covers.openlibrary.org/b/id/${coverIDData.covers[0]}-M.jpg`;
            }
          }
        }

        setBookDetails(details);
      } else {
        setError("Book details not found.");
      }
    } catch (err) {
      console.error("Error fetching book details:", err);
      setError("Failed to fetch book details.");
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchBookDetails = useCallback(
    debounce(fetchBookDetails, 500),
    [fetchBookDetails]
  ); // Debounce to prevent rapid API calls

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={homeStyles.reactLogo}
        />
      }
    >
      <ThemedView style={homeStyles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={homeStyles.stepContainer}>
        <ThemedText>
          When you're ready, tap the button below to scan a book cover.
        </ThemedText>
      </ThemedView>

      <ScrollView contentContainerStyle={homeStyles.container}>
        <Button title="Scan Book Cover" onPress={pickImage} />
        {image && <Image source={{ uri: image }} style={homeStyles.image} />}
        {loading && <ActivityIndicator size="large" />}
        {ocrText && (
          <Text style={homeStyles.text}>Detected Text: {ocrText}</Text>
        )}
        {error && <Text style={homeStyles.error}>{error}</Text>}
        {bookDetails && (
          <View style={homeStyles.bookDetails}>
            {bookDetails.coverUrl && (
              <Image
                source={{
                  uri: `${bookDetails.coverUrl}`,
                }}
                style={homeStyles.thumbnail}
              />
            )}
            <Text style={homeStyles.title}>{bookDetails.title}</Text>
            {bookDetails.authors && (
              <Text style={homeStyles.author}>
                By: {bookDetails.authors ?? "N/A"}
              </Text>
            )}
            {bookDetails.firstPublishYear && (
              <Text style={homeStyles.author}>
                First Published: {bookDetails.firstPublishYear || "Unknown"}
              </Text>
            )}
            <Text style={homeStyles.description}>
              {bookDetails.description}
            </Text>
          </View>
        )}
      </ScrollView>
    </ParallaxScrollView>
  );
}
