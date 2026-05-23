import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

import { CardBackId } from "@/types/card";
import { DEFAULT_CARD_BACK_ID, getCardBackOption } from "@/data/card-backs";

type CardBackPreviewProps = {
  cardBackId?: CardBackId | null;
  width: number;
  label?: string;
};

const CARD_BACK_ASPECT_RATIO = 375 / 523;
const COLOR_PIPS = [
  { color: "#efe6ba", x: 0, y: -29, text: "W" },
  { color: "#76b9d4", x: 28, y: -9, text: "U" },
  { color: "#312b2e", x: 18, y: 25, text: "B" },
  { color: "#c75a36", x: -18, y: 25, text: "R" },
  { color: "#7ba45b", x: -28, y: -9, text: "G" },
];

export function CardBackPreview({
  cardBackId = DEFAULT_CARD_BACK_ID,
  width,
  label,
}: CardBackPreviewProps) {
  const option = getCardBackOption(cardBackId);
  const height = width / CARD_BACK_ASPECT_RATIO;
  const scale = width / 375;
  const sourceScale = option.sourceScale ?? 1;
  const sourceTranslateY = option.sourceTranslateY ?? 0;

  if (option.source) {
    return (
      <View
        style={{
          width,
          height,
          borderRadius: 18 * scale,
          borderCurve: "continuous",
          backgroundColor: "#050403",
          overflow: "hidden",
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          source={option.source}
          resizeMode="cover"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: [
              { translateY: sourceTranslateY * scale },
              { scale: sourceScale },
            ],
          }}
        />
        {label ? (
          <Text
            selectable={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              position: "absolute",
              bottom: 18 * scale,
              left: 30 * scale,
              right: 30 * scale,
              color: "rgba(255, 244, 216, 0.82)",
              fontSize: 10 * scale,
              lineHeight: 12 * scale,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 18 * scale,
        borderCurve: "continuous",
        backgroundColor: option.palette.outer,
        overflow: "hidden",
        padding: 15 * scale,
      }}
    >
      <LinearGradient
        colors={[option.palette.panel, option.palette.inner, option.palette.panelDeep]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.82, y: 1 }}
        style={{
          flex: 1,
          borderRadius: 12 * scale,
          borderCurve: "continuous",
          borderWidth: 2 * scale,
          borderColor: "rgba(255, 210, 130, 0.42)",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 12 * scale,
            borderRadius: 120 * scale,
            borderWidth: 1.8 * scale,
            borderColor: "rgba(255, 232, 168, 0.42)",
            opacity: 0.7,
          }}
        />
        <CornerRivet top={16 * scale} left={17 * scale} size={18 * scale} color={option.palette.accent} />
        <CornerRivet top={16 * scale} right={17 * scale} size={18 * scale} color={option.palette.accent} />
        <CornerRivet bottom={16 * scale} left={17 * scale} size={18 * scale} color={option.palette.accent} />
        <CornerRivet bottom={16 * scale} right={17 * scale} size={18 * scale} color={option.palette.accent} />

        <Text
          selectable={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            position: "absolute",
            top: 47 * scale,
            left: 30 * scale,
            right: 30 * scale,
            color: option.palette.title,
            fontSize: 42 * scale,
            lineHeight: 47 * scale,
            fontWeight: "900",
            textAlign: "center",
            letterSpacing: 0,
            textShadowColor: "rgba(0, 0, 0, 0.82)",
            textShadowOffset: { width: 0, height: 2 * scale },
            textShadowRadius: 2 * scale,
          }}
        >
          CARDMAGIC
        </Text>

        <LinearGradient
          colors={[option.palette.oval, option.palette.ovalDeep]}
          start={{ x: 0.14, y: 0 }}
          end={{ x: 0.86, y: 1 }}
          style={{
            width: 236 * scale,
            height: 156 * scale,
            borderRadius: 999,
            borderWidth: 5 * scale,
            borderColor: "rgba(24, 18, 12, 0.9)",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 ${8 * scale}px ${18 * scale}px rgba(0, 0, 0, 0.36)`,
          }}
        >
          <View
            style={{
              width: 114 * scale,
              height: 114 * scale,
              borderRadius: 57 * scale,
              borderWidth: 2 * scale,
              borderColor: "rgba(255, 255, 255, 0.34)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {COLOR_PIPS.map((pip) => (
              <View
                key={pip.text}
                style={{
                  position: "absolute",
                  width: 31 * scale,
                  height: 31 * scale,
                  borderRadius: 15.5 * scale,
                  backgroundColor: pip.color,
                  borderWidth: 1.6 * scale,
                  borderColor: "rgba(10, 10, 10, 0.86)",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [
                    { translateX: pip.x * scale },
                    { translateY: pip.y * scale },
                  ],
                }}
              >
                <Text
                  selectable={false}
                  style={{
                    color: pip.text === "B" ? "#f2eee5" : "#18140f",
                    fontSize: 13 * scale,
                    lineHeight: 15 * scale,
                    fontWeight: "900",
                  }}
                >
                  {pip.text}
                </Text>
              </View>
            ))}
            <Text
              selectable={false}
              style={{
                color: "#fff1c2",
                fontSize: 25 * scale,
                lineHeight: 27 * scale,
                fontWeight: "900",
                textShadowColor: "rgba(0, 0, 0, 0.68)",
                textShadowOffset: { width: 0, height: 1 * scale },
                textShadowRadius: 1 * scale,
              }}
            >
              CM
            </Text>
          </View>
        </LinearGradient>

        <View
          style={{
            position: "absolute",
            bottom: 91 * scale,
            left: 54 * scale,
            right: 54 * scale,
            minHeight: 42 * scale,
            borderRadius: 999,
            borderWidth: 2 * scale,
            borderColor: "rgba(255, 232, 168, 0.62)",
            backgroundColor: "rgba(20, 12, 8, 0.55)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            selectable={false}
            style={{
              color: "#fff4d2",
              fontSize: 28 * scale,
              lineHeight: 31 * scale,
              fontWeight: "900",
              letterSpacing: 0,
            }}
          >
            PROXY
          </Text>
        </View>
        <Text
          selectable={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            position: "absolute",
            bottom: 51 * scale,
            left: 32 * scale,
            right: 32 * scale,
            color: "#f8deb0",
            fontSize: 13 * scale,
            lineHeight: 16 * scale,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          NOT TOURNAMENT LEGAL
        </Text>
        {label ? (
          <Text
            selectable={false}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              position: "absolute",
              bottom: 25 * scale,
              left: 30 * scale,
              right: 30 * scale,
              color: "rgba(255, 244, 216, 0.82)",
              fontSize: 10 * scale,
              lineHeight: 12 * scale,
              fontWeight: "800",
              textAlign: "center",
            }}
          >
            {label}
          </Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

function CornerRivet({
  color,
  size,
  top,
  right,
  bottom,
  left,
}: {
  color: string;
  size: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top,
        right,
        bottom,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(1, size * 0.09),
        borderColor: "rgba(60, 18, 10, 0.82)",
        backgroundColor: color,
      }}
    />
  );
}
