import React, { useState, useEffect, useRef } from 'react';

function Game() {

    // React states
    const [positionBall, setPositionBall] = useState({ x: 200, y: 150, dx: 1, dy: -3 });
    const [paddle, setPaddle] = useState({ paddlex: 0, paddleh: 10, paddlew: 75 });
    const [bricks, setBricks] = useState([]);
    const [score, setScore] = useState(0);
    const [paused, setPaused] = useState(false);
    const [allBricksCleared, setAllBricksCleared] = useState(false);
    const [ballMoving, setBallMoving] = useState(true);
    const canvasRef = useRef(null); // Reference to the canvas element

    // Constants
    const width = 500;
    const height = 300;
    const nrows = 6;
    const ncols = 6;
    const brickHeight = 15;
    const brickWidth = width / ncols;
    const padding = 1;
    const ballRadius = 10;
    const brick_colors = ["pink", "fuchsia", "aqua", "blue", "purple"];
    const paddlecolor = "black";
    const ballcolor = "black";
    const backcolor = "grey";

    // Initialize the game
    useEffect(() => {
        setPaddle(prevPaddle => ({ ...prevPaddle, paddlex: canvasRef.current.width / 2 }));
        initBricks();
    }, []);

    // Initialize bricks
    const initBricks = () => {
        const newBricks = Array.from({ length: nrows }, () =>
            new Array(ncols).fill(true)
        );
        setBricks(newBricks);
    };   

    useEffect(() => {
      let animationFrameId;
  
      const animate = () => {
          
  
          // Render the frame
          const ctx = canvasRef.current.getContext('2d');
          clearCanvas(ctx);          // Clear the canvas for the new frame
          drawBall(ctx);             // Draw the ball
          drawPaddle(ctx);           // Draw the paddle
          drawBricks(ctx);           // Draw the bricks

          if (!allBricksCleared) { // Only update game state if all bricks are not cleared
            updateBallPosition();
            collisionDetection();
          }
  
          // Request the next frame
          animationFrameId = requestAnimationFrame(animate);
      };
  
      if (!paused) {
          animationFrameId = requestAnimationFrame(animate);
      }
  
      return () => {
          cancelAnimationFrame(animationFrameId);
      };
    }, [positionBall, paddle, bricks, score, paused, allBricksCleared]); // Dependencies

    // Clear the canvas and fill with background color
    const clearCanvas = (ctx) => {
        if (canvasRef && canvasRef.current) {
            ctx.fillStyle = backcolor;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };

    // Draw the ball on the canvas
    const drawBall = (ctx) => {
        ctx.beginPath();
        ctx.arc(positionBall.x, positionBall.y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = ballcolor;
        ctx.fill();
        ctx.closePath();
    };

    // Draw the paddle on the canvas
    const drawPaddle = (ctx) => {
        ctx.beginPath();
        ctx.rect(paddle.paddlex, canvasRef.current.height - paddle.paddleh, paddle.paddlew, paddle.paddleh);
        ctx.fillStyle = paddlecolor;
        ctx.fill();
        ctx.closePath();
    };

    // Draw the bricks on the canvas
    const drawBricks = (ctx) => {
        for (let i = 0; i < nrows; i++) {
            for (let j = 0; j < ncols; j++) {
                if (bricks[i] && bricks[i][j]) {
                    let brickX = (j * (brickWidth));
                    let brickY = (i * (brickHeight));
                    ctx.beginPath();
                    ctx.rect(brickX, brickY, brickWidth, brickHeight);
                    ctx.fillStyle = brick_colors[(i + j) % brick_colors.length];
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    };

    // Function to reset the game to its initial state
    const reload = () => {
        // Reset all states to initial values
        setPositionBall({ x: 200, y: 150, dx: 1, dy: -3 });
        setPaddle(prevPaddle => ({ ...prevPaddle, paddlex: canvasRef.current.width / 2 }));
        setScore(0);
        setPaused(false);
        initBricks();
    };

    // Handle collisions with walls, paddle, bricks, and ground
    const collisionDetection = () => {
        // Wall collision
        if (positionBall.x + positionBall.dx > canvasRef.current.width - ballRadius || positionBall.x + positionBall.dx < ballRadius) {
            setPositionBall(positionBall => ({ ...positionBall, dx: -positionBall.dx }));
        }

        // Ceiling collision
        if (positionBall.y + positionBall.dy < ballRadius) {
            setPositionBall(positionBall => ({ ...positionBall, dy: -positionBall.dy }));
        }

        // Paddle collision
        if (positionBall.y + positionBall.dy > canvasRef.current.height - paddle.paddleh - ballRadius && 
            positionBall.y + positionBall.dy < canvasRef.current.height - ballRadius && // Check if the ball is moving downwards
            positionBall.x + ballRadius > paddle.paddlex && 
            positionBall.x - ballRadius < paddle.paddlex + paddle.paddlew) {
            setPositionBall(positionBall => ({ ...positionBall, dy: -positionBall.dy }));
        }

        // Ground collision (Game Over)
        if (positionBall.y + ballRadius >= canvasRef.current.height) {
          setPaused(true);
          alert("Game Over!"); // Display game over message
        }

        // Bricks collision
        let row = Math.floor(positionBall.y / (brickHeight + padding));
        let col = Math.floor(positionBall.x / (brickWidth + padding));
        if (row < nrows && col < ncols && bricks[row][col]) {
            setBricks(bricks => {
                const newBricks = bricks.map((rowBricks, i) =>
                    rowBricks.map((brick, j) => {
                        if (i === row && j === col) return false;
                        return brick;
                    })
                );

                // Check if all bricks are cleared in the new state
                const allCleared = newBricks.every(rowBricks => rowBricks.every(brick => !brick));
                
                if (allCleared) {
                    setAllBricksCleared(true);
                    setBallMoving(false);  
                }

                return newBricks;
            });
            setScore(score + 1);
            setPositionBall(positionBall => ({ ...positionBall, dy: -positionBall.dy }));

        }

    };

    // Add a new useEffect to display the victory message when all bricks are cleared and the ball has stopped moving
    useEffect(() => {
      if (!ballMoving && allBricksCleared) {
          alert("Congratulations! You've cleared all the bricks!");
      }
    }, [allBricksCleared, ballMoving]);

    // Update the position of the ball based on its current trajectory
    const updateBallPosition = () => {
      setPositionBall(positionBall => ({
          x: positionBall.x + positionBall.dx,
          y: positionBall.y + positionBall.dy,
          dx: positionBall.dx,
          dy: positionBall.dy
      }));
    };

    const onMouseMove = (evt) => {
    const canvas = canvasRef.current;
    const relativeX = evt.clientX - canvas.getBoundingClientRect().left;

    // Calculate the new paddle position
    let newPaddleX = relativeX - paddle.paddlew / 2;

    // Ensure the paddle stays within the canvas bounds
    newPaddleX = Math.max(newPaddleX, 0); // Prevents going left beyond canvas
    newPaddleX = Math.min(newPaddleX, canvas.width - paddle.paddlew); // Prevents going right beyond canvas

    setPaddle({ ...paddle, paddlex: newPaddleX });
    };

    // Update paddle position based on mouse movement
    useEffect(() => {
      const handleMouseMove = (evt) => {
        onMouseMove(evt);
      };
      // Add mouse move event listener to the canvas for paddle control
      canvasRef.current.addEventListener("mousemove", handleMouseMove);
    
      return () => {
        canvasRef.current.removeEventListener("mousemove", handleMouseMove);
      };
    }, []);

    // Add key down event listener to toggle the game pause state
    useEffect(() => {
        const handleKeyDown = () => {
            setPaused((prevPaused) => !prevPaused);
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [paused]);

    // Render the game UI including canvas, score, and controls
    return (
      <div>
          <h1>Brick Breaker</h1>
          <canvas ref={canvasRef} width={width} height={height} onMouseMove={onMouseMove}/>
          <p>Mouse moves platform &bull; Press any key to pause</p>
          <button onClick={reload}>Play again</button>
          <div>Score: {score}</div>
      </div>
    );
}

export default Game;
