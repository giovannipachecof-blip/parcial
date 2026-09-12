import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from "react-native";

const { width, height } = Dimensions.get("window");

// =========================
// CONFIGURACIÓN DEL JUEGO
// =========================

const GAME_WIDTH = width;
const GAME_HEIGHT = height - 100;

const PADDLE_WIDTH = 90;
const PADDLE_HEIGHT = 15;

const BALL_SIZE = 14;

const BRICK_ROWS = 5;
const BRICK_COLS = 6;

const BRICK_WIDTH = (GAME_WIDTH - 40) / BRICK_COLS;
const BRICK_HEIGHT = 25;

// =========================
// CREAR LADRILLOS
// =========================

const createBricks = () => {
  const bricks = [];

  const colors = [
    "#ff3030",
    "#ff8c00",
    "#ffd700",
    "#00d26a",
    "#00aaff",
  ];

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({
        id: `${row}-${col}`,
        x: 20 + col * BRICK_WIDTH,
        y: 50 + row * (BRICK_HEIGHT + 8),
        alive: true,
        color: colors[row],
      });
    }
  }

  return bricks;
};

// =========================
// APP
// =========================

export default function App() {
  // -------------------------
  // PALeta
  // -------------------------

  const [paddleX, setPaddleX] = useState(
    GAME_WIDTH / 2 - PADDLE_WIDTH / 2
  );

  const paddleRef = useRef(
    GAME_WIDTH / 2 - PADDLE_WIDTH / 2
  );

  // -------------------------
  // PELOTA
  // -------------------------

  const [ball, setBall] = useState({
    x: GAME_WIDTH / 2 - BALL_SIZE / 2,
    y: GAME_HEIGHT - 120,
    dx: 4,
    dy: -4,
  });

  // -------------------------
  // LADRILLOS
  // -------------------------

  const [bricks, setBricks] = useState(createBricks());

  // -------------------------
  // ESTADO DEL JUEGO
  // -------------------------

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);

  // =========================
  // ACTUALIZAR REFERENCIA
  // =========================

  useEffect(() => {
    paddleRef.current = paddleX;
  }, [paddleX]);

  // =========================
  // MOVIMIENTO DE LA PELOTA
  // =========================

  useEffect(() => {
    if (gameOver || win) {
      return;
    }

    const interval = setInterval(() => {
      setBall((oldBall) => {
        let x = oldBall.x;
        let y = oldBall.y;

        let dx = oldBall.dx;
        let dy = oldBall.dy;

        // -------------------------
        // MOVER PELOTA
        // -------------------------

        x += dx;
        y += dy;

        // -------------------------
        // PARED IZQUIERDA
        // -------------------------

        if (x <= 0) {
          x = 0;
          dx = Math.abs(dx);
        }

        // -------------------------
        // PARED DERECHA
        // -------------------------

        if (x + BALL_SIZE >= GAME_WIDTH) {
          x = GAME_WIDTH - BALL_SIZE;
          dx = -Math.abs(dx);
        }

        // -------------------------
        // TECHO
        // -------------------------

        if (y <= 0) {
          y = 0;
          dy = Math.abs(dy);
        }

        // -------------------------
        // PALETA
        // -------------------------

        const paddleY = GAME_HEIGHT - 50;

        const hitPaddle =
          y + BALL_SIZE >= paddleY &&
          y <= paddleY + PADDLE_HEIGHT &&
          x + BALL_SIZE >= paddleRef.current &&
          x <= paddleRef.current + PADDLE_WIDTH &&
          dy > 0;

        if (hitPaddle) {
          y = paddleY - BALL_SIZE;

          dy = -Math.abs(dy);

          // Dirección dependiendo
          // de dónde golpea la pelota

          const paddleCenter =
            paddleRef.current + PADDLE_WIDTH / 2;

          const ballCenter = x + BALL_SIZE / 2;

          const difference =
            ballCenter - paddleCenter;

          dx = difference / 8;

          // Evitar que vaya demasiado vertical

          if (Math.abs(dx) < 2) {
            dx = dx < 0 ? -2 : 2;
          }
        }

        // -------------------------
        // LADRILLOS
        // -------------------------

        setBricks((currentBricks) => {
          let collision = false;

          const newBricks = currentBricks.map((brick) => {
            if (!brick.alive || collision) {
              return brick;
            }

            const hitBrick =
              x + BALL_SIZE >= brick.x &&
              x <= brick.x + BRICK_WIDTH &&
              y + BALL_SIZE >= brick.y &&
              y <= brick.y + BRICK_HEIGHT;

            if (hitBrick) {
              collision = true;

              return {
                ...brick,
                alive: false,
              };
            }

            return brick;
          });

          // Si golpeó un ladrillo

          if (collision) {
            setScore((currentScore) => currentScore + 10);

            dy = -dy;
          }

          // Comprobar victoria

          const remaining =
            newBricks.filter((brick) => brick.alive);

          if (remaining.length === 0) {
            setWin(true);
          }

          return newBricks;
        });

        // -------------------------
        // PELOTA FUERA
        // -------------------------

        if (y > GAME_HEIGHT) {
          setLives((currentLives) => {
            if (currentLives <= 1) {
              setGameOver(true);

              return 0;
            }

            // Reiniciar pelota

            setBall({
              x: GAME_WIDTH / 2 - BALL_SIZE / 2,
              y: GAME_HEIGHT - 120,
              dx: 4,
              dy: -4,
            });

            return currentLives - 1;
          });

          return oldBall;
        }

        // -------------------------
        // NUEVA POSICIÓN
        // -------------------------

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

  // =========================
  // MOVER PALETA
  // =========================

  const movePaddle = (event) => {
    if (gameOver || win) {
      return;
    }

    const touchX = event.nativeEvent.locationX;

    let newX = touchX - PADDLE_WIDTH / 2;

    // No salir por la izquierda

    if (newX < 0) {
      newX = 0;
    }

    // No salir por la derecha

    if (newX > GAME_WIDTH - PADDLE_WIDTH) {
      newX = GAME_WIDTH - PADDLE_WIDTH;
    }

    paddleRef.current = newX;

    setPaddleX(newX);
  };

  // =========================
  // REINICIAR JUEGO
  // =========================

  const restartGame = () => {
    const center =
      GAME_WIDTH / 2 - PADDLE_WIDTH / 2;

    paddleRef.current = center;

    setPaddleX(center);

    setBall({
      x: GAME_WIDTH / 2 - BALL_SIZE / 2,
      y: GAME_HEIGHT - 120,
      dx: 4,
      dy: -4,
    });

    setBricks(createBricks());

    setScore(0);

    setLives(3);

    setGameOver(false);

    setWin(false);
  };

  // =========================
  // PANTALLA
  // =========================

  return (
    <View style={styles.container}>

      {/* =====================
          MARCADOR
      ====================== */}

      <View style={styles.header}>

        <Text style={styles.title}>
          BREAKOUT
        </Text>

        <Text style={styles.info}>
          PUNTOS: {score}    VIDAS: {lives}
        </Text>

      </View>

      {/* =====================
          ÁREA DEL JUEGO
      ====================== */}

      <View
        style={styles.game}

        // Permite tocar
        onStartShouldSetResponder={() => true}

        // Permite arrastrar
        onMoveShouldSetResponder={() => true}

        // Detectar movimiento
        onResponderMove={movePaddle}
      >

        {/* =====================
            LADRILLOS
        ====================== */}

        {bricks.map((brick) => {
          if (!brick.alive) {
            return null;
          }

          return (
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
          );
        })}

        {/* =====================
            PELOTA
        ====================== */}

        <View
          style={[
            styles.ball,
            {
              left: ball.x,
              top: ball.y,
            },
          ]}
        />

        {/* =====================
            PALETA
        ====================== */}

        <View
          style={[
            styles.paddle,
            {
              left: paddleX,
            },
          ]}
        />

        {/* =====================
            GAME OVER / GANASTE
        ====================== */}

        {(gameOver || win) && (
          <View style={styles.overlay}>

            <Text style={styles.gameTitle}>
              {win ? "¡GANASTE!" : "GAME OVER"}
            </Text>

            <Text style={styles.finalScore}>
              PUNTOS: {score}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={restartGame}
            >
              <Text style={styles.buttonText}>
                JUGAR DE NUEVO
              </Text>
            </TouchableOpacity>

          </View>
        )}

      </View>
    </View>
  );
}

// =========================
// ESTILOS
// =========================

const styles = StyleSheet.create({

  // -------------------------
  // CONTENEDOR
  // -------------------------

  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  // -------------------------
  // HEADER
  // -------------------------

  header: {
    height: 100,

    backgroundColor: "#111",

    justifyContent: "center",

    alignItems: "center",

    borderBottomWidth: 2,

    borderBottomColor: "#333",
  },

  // -------------------------
  // TÍTULO
  // -------------------------

  title: {
    color: "#00ff66",

    fontSize: 28,

    fontWeight: "bold",

    letterSpacing: 5,
  },

  // -------------------------
  // MARCADOR
  // -------------------------

  info: {
    color: "#ffffff",

    fontSize: 16,

    marginTop: 8,

    fontWeight: "bold",
  },

  // -------------------------
  // ÁREA DEL JUEGO
  // -------------------------

  game: {
    width: GAME_WIDTH,

    height: GAME_HEIGHT,

    backgroundColor: "#000000",

    position: "relative",

    overflow: "hidden",
  },

  // -------------------------
  // LADRILLOS
  // -------------------------

  brick: {
    position: "absolute",

    width: BRICK_WIDTH - 5,

    height: BRICK_HEIGHT,

    borderRadius: 4,

    borderWidth: 1,

    borderColor: "#ffffff",
  },

  // -------------------------
  // PELOTA
  // -------------------------

  ball: {
    position: "absolute",

    width: BALL_SIZE,

    height: BALL_SIZE,

    borderRadius: BALL_SIZE / 2,

    backgroundColor: "#ffffff",

    shadowColor: "#ffffff",

    shadowOpacity: 1,

    shadowRadius: 10,
  },

  // -------------------------
  // PALETA
  // -------------------------

  paddle: {
    position: "absolute",

    bottom: 50,

    width: PADDLE_WIDTH,

    height: PADDLE_HEIGHT,

    backgroundColor: "#00ff66",

    borderRadius: 5,
  },

  // -------------------------
  // OVERLAY
  // -------------------------

  overlay: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,

    backgroundColor: "rgba(0, 0, 0, 0.88)",

    justifyContent: "center",

    alignItems: "center",
  },

  // -------------------------
  // GAME OVER
  // -------------------------

  gameTitle: {
    color: "#00ff66",

    fontSize: 38,

    fontWeight: "bold",

    marginBottom: 15,
  },

  // -------------------------
  // PUNTOS FINALES
  // -------------------------

  finalScore: {
    color: "#ffffff",

    fontSize: 20,

    marginBottom: 30,
  },

  // -------------------------
  // BOTÓN
  // -------------------------

  button: {
    backgroundColor: "#00ff66",

    paddingVertical: 15,

    paddingHorizontal: 25,

    borderRadius: 8,
  },

  buttonText: {
    color: "#000000",

    fontWeight: "bold",

    fontSize: 16,
  },
});
