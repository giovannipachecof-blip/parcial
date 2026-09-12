import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";

const { width, height } = Dimensions.get("window");

const GAME_WIDTH = width;
const GAME_HEIGHT = height - 100;

const PADDLE_WIDTH = 90;
const PADDLE_HEIGHT = 15;
const BALL_SIZE = 14;

const BRICK_ROWS = 5;
const BRICK_COLS = 6;
const BRICK_WIDTH = (GAME_WIDTH - 40) / BRICK_COLS;
const BRICK_HEIGHT = 25;

const initialBricks = () => {
  const bricks = [];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({
        id: `${row}-${col}`,
        x: 20 + col * BRICK_WIDTH,
        y: 70 + row * (BRICK_HEIGHT + 8),
        alive: true,
        color: [
          "#ff3030",
          "#ff8c00",
          "#ffd700",
          "#00d26a",
          "#00aaff",
        ][row],
      });
    }
  }

  return bricks;
};

export default function App() {
  const [paddleX, setPaddleX] = useState(
    GAME_WIDTH / 2 - PADDLE_WIDTH / 2
  );

  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2 - BALL_SIZE / 2,
    y: GAME_HEIGHT - 150,
    dx: 4,
    dy: -4,
  });

  const [bricks, setBricks] = useState(initialBricks());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  const paddleRef = useRef(paddleX);

  useEffect(() => {
    paddleRef.current = paddleX;
  }, [paddleX]);

  useEffect(() => {
    if (gameOver || win) return;

    const interval = setInterval(() => {
      setBall((oldBall) => {
        let { x, y, dx, dy } = oldBall;

        x += dx;
        y += dy;

        // Pared izquierda
        if (x <= 0) {
          x = 0;
          dx = Math.abs(dx);
        }

        // Pared derecha
        if (x + BALL_SIZE >= GAME_WIDTH) {
          x = GAME_WIDTH - BALL_SIZE;
          dx = -Math.abs(dx);
        }

        // Techo
        if (y <= 0) {
          y = 0;
          dy = Math.abs(dy);
        }

        // Colisión con la paleta
        const paddleY = GAME_HEIGHT - 50;

        if (
          y + BALL_SIZE >= paddleY &&
          y <= paddleY + PADDLE_HEIGHT &&
          x + BALL_SIZE >= paddleRef.current &&
          x <= paddleRef.current + PADDLE_WIDTH &&
          dy > 0
        ) {
          dy = -Math.abs(dy);

          // Cambia la dirección según dónde golpee la pelota
          const hitPosition =
            (x + BALL_SIZE / 2 - paddleRef.current) / PADDLE_WIDTH;

          dx = (hitPosition - 0.5) * 10;
        }

        // Colisión con ladrillos
        setBricks((currentBricks) => {
          let hit = false;

          const updated = currentBricks.map((brick) => {
            if (!brick.alive || hit) return brick;

            const collision =
              x + BALL_SIZE >= brick.x &&
              x <= brick.x + BRICK_WIDTH &&
              y + BALL_SIZE >= brick.y &&
              y <= brick.y + BRICK_HEIGHT;

            if (collision) {
              hit = true;
              return {
                ...brick,
                alive: false,
              };
            }

            return brick;
          });

          if (hit) {
            setScore((s) => s + 10);
            dy = -dy;
          }

          const remaining = updated.filter((b) => b.alive);

          if (remaining.length === 0) {
            setWin(true);
          }

          return updated;
        });

        // La pelota cayó
        if (y > GAME_HEIGHT) {
          setLives((oldLives) => {
            if (oldLives <= 1) {
              setGameOver(true);
              return 0;
            }

            // Reiniciar pelota
            setBall({
              x: GAME_WIDTH / 2 - BALL_SIZE / 2,
              y: GAME_HEIGHT - 150,
              dx: 4,
              dy: -4,
            });

            return oldLives - 1;
          });

          return oldBall;
        }

        return {
          x,
          y,
          dx,
          dy,
        };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [gameOver, win]);

  // Mover la paleta tocando la pantalla
  const movePaddle = (event) => {
    if (gameOver || win) return;

    const touchX = event.nativeEvent.locationX;

    let newX = touchX - PADDLE_WIDTH / 2;

    if (newX < 0) newX = 0;

    if (newX > GAME_WIDTH - PADDLE_WIDTH) {
      newX = GAME_WIDTH - PADDLE_WIDTH;
    }

    setPaddleX(newX);
  };

  const restartGame = () => {
    setPaddleX(GAME_WIDTH / 2 - PADDLE_WIDTH / 2);
    paddleRef.current = GAME_WIDTH / 2 - PADDLE_WIDTH / 2;

    setBall({
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT - 150,
      dx: 4,
      dy: -4,
    });

    setBricks(initialBricks());
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWin(false);
  };

  return (
    <View style={styles.container}>
      {/* Marcador */}
      <View style={styles.header}>
        <Text style={styles.title}>BREAKOUT</Text>

        <Text style={styles.info}>
          Puntos: {score}    Vidas: {lives}
        </Text>
      </View>

      {/* Área del juego */}
      <TouchableWithoutFeedback onPress={movePaddle}>
        <View
          style={styles.game}
          onTouchMove={movePaddle}
        >
          {/* Ladrillos */}
          {bricks.map(
            (brick) =>
              brick.alive && (
                <View
                  key={brick.id}
                  style={[
                    styles.brick,
                    {
                      left: brick.x,
                      top: brick.y,
                      backgroundColor: brick.color,
                    },
                  ]}
                />
              )
          )}

          {/* Pelota */}
          <View
            style={[
              styles.ball,
              {
                left: ball.x,
                top: ball.y,
              },
            ]}
          />

          {/* Paleta */}
          <View
            style={[
              styles.paddle,
              {
                left: paddleX,
              },
            ]}
          />

          {/* Game Over / Victoria */}
          {(gameOver || win) && (
            <View style={styles.overlay}>
              <Text style={styles.gameTitle}>
                {win ? "¡GANASTE!" : "GAME OVER"}
              </Text>

              <Text style={styles.finalScore}>
                Puntos: {score}
              </Text>

              <TouchableWithoutFeedback onPress={restartGame}>
                <View style={styles.button}>
                  <Text style={styles.buttonText}>
                    JUGAR DE NUEVO
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  header: {
    height: 100,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
  },

  title: {
    color: "#00ff66",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 5,
  },

  info: {
    color: "white",
    fontSize: 16,
    marginTop: 8,
  },

  game: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#000",
    position: "relative",
    overflow: "hidden",
  },

  brick: {
    position: "absolute",
    width: BRICK_WIDTH - 5,
    height: BRICK_HEIGHT,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#fff",
  },

  paddle: {
    position: "absolute",
    bottom: 50,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    backgroundColor: "#00ff66",
    borderRadius: 5,
  },

  ball: {
    position: "absolute",
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: "#fff",
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 10,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  gameTitle: {
    color: "#00ff66",
    fontSize: 38,
    fontWeight: "bold",
    marginBottom: 15,
  },

  finalScore: {
    color: "#fff",
    fontSize: 20,
    marginBottom: 30,
  },

  button: {
    backgroundColor: "#00ff66",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
  },

  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
