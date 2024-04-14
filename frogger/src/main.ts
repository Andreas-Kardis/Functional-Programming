import "./style.css";
import { fromEvent, interval } from "rxjs";
import { map, filter, scan, merge } from "rxjs/operators";

function main() {
  /**
   * Inside this function you will use the classes and functions from rx.js
   * to add visuals to the svg element in pong.html, animate them, and make them interactive.
   *
   * Study and complete the tasks in observable examples first to get ideas.
   *
   * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
   *
   * You will be marked on your functional programming style
   * as well as the functionality that you implement.
   *
   * Document your code!
   */

  /**
   * This is the view for your game to add and update your game elements.
   */
  function frogger() {
    // defining the type of variables inside the Body, State and logBody objects
    // State defines all bodies within the game that is appended to the svg, as well as the score
    interface State {
      readonly frog: Body,
      readonly car1: ReadonlyArray<Body>,
      readonly car2: ReadonlyArray<Body>,
      readonly car3: ReadonlyArray<Body>,
      readonly car4: ReadonlyArray<Body>,
      readonly log1: ReadonlyArray<logBody>,
      readonly log2: ReadonlyArray<logBody>,
      readonly log3: ReadonlyArray<logBody>,
      readonly turtle1: ReadonlyArray<Body>,
      readonly turtle2: ReadonlyArray<Body>,
      readonly fly: ReadonlyArray<Body>,
      readonly finishSpots: ReadonlyArray<logBody>,
      readonly score: number
    };

    // Body defines the attributes of all spherical objects
    interface Body {
      readonly pos: Vector,
      readonly radius: number,
      readonly vel: Vector,
      timer: number,
      readonly maxY: number,
      readonly id: string,
      readonly viewType: string
    };

    // logBody defines the attributes to all rectangular objects
    interface logBody {
      readonly pos: Vector,
      readonly height: number,
      readonly length: number,
      readonly vel: Vector,
      readonly id: string,
      readonly viewType: string
    };

    // The type of object being created
    type ViewType = 'Car' | 'Log' | 'Turtle' | 'Fly' | 'FinishSpot';

    // defining constant to create an instance of a car within the Body object
    const createCar = (pos: Vector) => (vel: Vector) => (radius: number) => (timer:number) => (id: number) =>(viewType: ViewType) => 
      <Body>{
        pos: pos,
        vel: vel,
        radius: radius,
        timer: timer,
        id: `car${id}`,
        viewType: viewType
      };

    // creating first row of cars
    const startCar1 = (difficulty: number) => [1,2,3]
      .map((v) => createCar(new Vector(750 - 225*v, 525))(new Vector(1*difficulty, 0))(25)(0)(v)('Car'));

    // creating second row of cars
    const startCar2 = (difficulty: number) => [1,2]
      .map((v) => createCar(new Vector(500 - 100*v, 475))(new Vector(1.5*difficulty, 0))(25)(0)(3+v)('Car'));

    // creating third row of cars
    const startCar3 = (difficulty: number) => [1,2,3]
      .map((v) => createCar(new Vector(425 - 100*v, 425))(new Vector(0.6*difficulty, 0))(25)(0)(5+v)('Car'));

    // creating fourth row of cars
    const startCar4 = (difficulty: number) => [1,2,3]
      .map((v) => createCar(new Vector(500 - 250*v, 375))(new Vector(-1*difficulty, 0))(25)(0)(8+v)('Car'));

    // defining constant to create an instance of a log within the logBody object
    const createLog = (pos: Vector) => (vel: Vector) => (height: number) => (length: number) => (id: number) =>(viewType: ViewType) => 
    <logBody>{
      pos: pos,
      vel: vel,
      height: height,
      length: length,
      id: `log${id}`,
      viewType: viewType
    };

    // creating first row of logs
    const startLog1 = (difficulty: number) => [1,2]
      .map((v) => createLog(new Vector(750 - 300*v, 200))(new Vector(1*difficulty, 0))(50)(150)(v)('Log'));

    // creating second row of logs
    const startLog2 = (difficulty: number) => [1,2,3]
      .map((v) => createLog(new Vector(425 - 200*v, 150))(new Vector(-0.5*difficulty, 0))(50)(100)(2+v)('Log'));

    // creating third row of logs
    const startLog3 = (difficulty: number) => [1,2,3]
      .map((v) => createLog(new Vector(750 - 300*v, 100))(new Vector(1.1*difficulty, 0))(50)(200)(5+v)('Log'));

    // defining constant to create an instance of a turtle within the Body object
    const createTurtle = (pos: Vector) => (vel: Vector) => (radius: number) => (timer: number) => (id: number) => (viewType: ViewType) =>
      <Body>{
        pos: pos,
        vel: vel,
        radius: radius,
        timer: timer,
        id: `turtle${id}`,
        viewType: viewType
      };

    // creating first set of turtles
    const startTurtle1 = (difficulty: number) => [1,2,3]
      .map((v) => createTurtle(new Vector(650 - 50*v, 75))(new Vector(1*difficulty, 0))(25)(0)(v)('Turtle'));

    // creating second set of turtles
    const startTurtle2 = (difficulty: number) => [1,2,3]
      .map((v) => createTurtle(new Vector(350 - 50*v, 75))(new Vector(1*difficulty, 0))(25)(0)(3+v)('Turtle'));

    // defining constant to create an instance of a fly within the Body object
    const createFly = (pos: Vector) => (radius: number) => (timer: number) => (id: number) => (viewType: ViewType) => 
      <Body>{
        pos: pos,
        vel: Vector.Zero,
        radius: radius,
        timer: timer,
        id: `fly${id}`,
        viewType: viewType
      };

    // creating three instances of the fly to sit ontop of the finish spots
    const startFly = [1,2,3]
      .map((v) => createFly(new Vector(115 + 187.5*(v-1), 25))(25)(0)(v)('Fly'));

    // defining constant to create an instance of a finish spot within the logBody object
    const createfinishSpots = (pos: Vector) => (height: number) => (length: number) => (id: number) =>(viewType: ViewType) =>
    <logBody>{
      pos: pos,
      vel: Vector.Zero,
      height: height,
      length: length,
      id: `finishSpot${id}`,
      viewType: viewType
    };

    // creating three instances of the finish spots
    const startFinishSpots = [1,2,3]
      .map((v) => createfinishSpots(new Vector(40 + (37.5+150)*(v-1),0))(50)(150)(v)('FinishSpot'))

    // creating the frog in a Body object
    const createFrog = () => {
      return <Body>{
        pos: new Vector(275, 575),
        radius: 25,
        vel: Vector.Zero,
        timer: 0,
        maxY: 575,
        id: 'frog',
        viewType: 'frog'
      };
    };

    // function returning the initial state of the game
    const startGame = () => <State>{ 
      frog: createFrog(),
      car1: startCar1(1),
      car2: startCar2(1),
      car3: startCar3(1),
      car4: startCar4(1),
      log1: startLog1(1),
      log2: startLog2(1),
      log3: startLog3(1),
      turtle1: startTurtle1(1),
      turtle2: startTurtle2(1),
      fly: startFly,
      finishSpots: startFinishSpots,
      score: 0
    };
    const initialState = startGame(); // defining initial state of game

    // reading in key inputs, filtering arrow keys to be used to move the frog.
    const keyObservable = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      filter(({key}) => key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight'),
      filter(({repeat}) => !repeat),
      map((d) => ((d.key)))
    );

    /* Moves the frog according to the arrow input read by keyObservable and checks for collision at this new position
    Input: initialState and arrow direction
    Output: new instance of initialState with the frogs position moved accordingly
    */
    function Move(state: State, arrowDirection: string|number): State {
      const frogDiameter = 2 * state.frog.radius;
      if (arrowDirection === 'ArrowUp' && state.frog.pos.y > 25) {
        if (state.frog.pos.y-frogDiameter < state.frog.maxY) {
          return moveObjects({...state, 
          frog: {...state.frog, pos: state.frog.pos.add(new Vector(0,-frogDiameter)), maxY: state.frog.maxY-frogDiameter},
          score: state.score + 10
          })
        } else {
          return moveObjects({...state, 
            frog: {...state.frog, pos: state.frog.pos.add(new Vector(0,-frogDiameter))}
          })
        }
      } else if (arrowDirection === 'ArrowDown' && state.frog.pos.y < 550){
        return moveObjects({...state, 
          frog: {...state.frog, pos: state.frog.pos.add(new Vector(0,frogDiameter))}
        })
      } else if (arrowDirection === 'ArrowRight' && state.frog.pos.x < 575){
        return moveObjects({...state,
          frog: {...state.frog, pos: state.frog.pos.add(new Vector(frogDiameter,0))}
        })
      } else if (arrowDirection === 'ArrowLeft' && state.frog.pos.x > 25) {
        return moveObjects({...state, 
          frog: {...state.frog, pos: state.frog.pos.add(new Vector(-frogDiameter,0))}
        })
      } else {
        return moveObjects(state)
      }
    };

    /* stop the frog moving past the edge of the game when on a log or turtle 
    Input: instance of frog and what the frog is on, turtle or log
    Output: instance of the frog as is or stopping on the moving log or turtle
    */
    const stopFrog = (frog: Body, obj: logBody|Body) => {
      if (frog.pos.x < 575 && frog.pos.x > 25) {
        return <Body>{
          ...frog
        }
      } else { //going outside screen
        return <Body>{
          ...frog,
        pos: frog.pos.add(frog.vel.add(obj.vel))
        }
      }
    }

    /* This allows the frog to move with the log or the turtle when riding on it 
    Input: instance of frog and what the frog is on, turtle or log
    Output: instance of the frog moving on the turtle or log
    */
    function moveFrogWObj(frog: Body, obj: logBody|Body): Body{
      return stopFrog({
        ...frog,
        pos: frog.pos.add(frog.vel.sub(obj.vel))
      }, obj)
    }
    
    /* function to restart the game
    Input: initialState
    Output: instance of new game from startGame()
    */
    const restartGame = (state: State) => {
      const svg = document.getElementById("svgCanvas")!;
      // post Game Over
      const updateGameOver = () => {
        function createGameOver() {
          const view = document.createElementNS(svg.namespaceURI, "text")!;
          view.setAttribute("x", "200");
          view.setAttribute("y", "300");
          view.classList.add("gameover");
          view.setAttribute("visibility", "visible");
          view.setAttribute("id", "gameover")
          view.textContent = "Game Over";
          svg.appendChild(view);
        };
        const postGameOver = document.getElementById("gameover") || createGameOver();
        postGameOver?.setAttribute("visibility", "visible");
      };
      updateGameOver();

      // post final score
      const updateFinalScore = () => {
        function createPostScore() {
          const view = document.createElementNS(svg.namespaceURI, "text")!;
          view.setAttribute("x", "200");
          view.setAttribute("y", "340");
          view.classList.add("finalScore");
          view.textContent = `Final Score: ${state.score}`;
          view.setAttribute("visibility", "visible");
          view.setAttribute("id", "finalScore");
          svg.appendChild(view);
        }
        if (document.getElementById("finalScore") === null) {
          createPostScore();
        } else {
          const postFinalScore = document.getElementById("finalScore");
          postFinalScore!.textContent = `Final Score: ${state.score}`;
          postFinalScore?.setAttribute("visibility", "visible");
        };
        
      }
      updateFinalScore();

      // Hide game over and the previous life score
      const postGameOver = document.getElementById("gameover");
      const postFinalScore = document.getElementById("finalScore");
      // function called to wait asynchronously 
      const hidePosts = () => {
        postFinalScore?.setAttribute("visibility", "hidden");
        postGameOver?.setAttribute("visibility", "hidden");
      }
      // waiting 6000ms asynchronously to hide end game posts
      setTimeout(hidePosts,6000);

      // make all finish spots now visible
      state.finishSpots.forEach((o) => {
        const view = document.getElementById(o.id);
        view?.setAttribute("visibility", "visible");
      })

      // return new instance of game
      return startGame();
    }

    /* Checks if there is a collision between the frog and any object
    Input: initialState
    Output: restartGame() or an updated positon of the frog
    */
    const collisionDetect = (state: State) => {
      // check if there is a collision with a car
      const checkCollisionCar = ([a,b]: [Body,Body]) => a.pos.sub(b.pos).len() < a.radius + b.radius;
      const carCollision1 = state.car1.filter((car) => checkCollisionCar([state.frog,car])).length > 0;
      const carCollision2 = state.car2.filter((car) => checkCollisionCar([state.frog,car])).length > 0;
      const carCollision3 = state.car3.filter((car) => checkCollisionCar([state.frog,car])).length > 0;
      const carCollision4 = state.car4.filter((car) => checkCollisionCar([state.frog,car])).length > 0;

      // check if there is a collision with a log
      // checkFrogOnLog takes in a Body and logBody state which calculates to see if the frog is anywhere on the log
      const checkFrogOnLog = ([a,b]: [Body,logBody]) => (a.pos.x + a.radius > b.pos.x) && (a.pos.x - a.radius < b.pos.x + b.length) && (a.pos.y - a.radius === b.pos.y);
      const logCollision1 = state.log1.filter((log) => checkFrogOnLog([state.frog, log])).length > 0;
      const logCollision2 = state.log2.filter((log) => checkFrogOnLog([state.frog, log])).length > 0;
      const logCollision3 = state.log3.filter((log) => checkFrogOnLog([state.frog, log])).length > 0;

      // check if there is a collision with a turtle
      const checkFrogOnTurtle = ([a,b]: [Body,Body]) => a.pos.sub(b.pos).len() < a.radius + b.radius;
      const frogOnTurtle1 = state.turtle1.filter((turtle) => checkFrogOnTurtle([state.frog, turtle]));
      const turtleCollision1 = frogOnTurtle1.length > 0;
      const frogOnTurtle2 = state.turtle2.filter((turtle) => checkFrogOnTurtle([state.frog, turtle]));
      const turtleCollision2 = frogOnTurtle2.length > 0;

      // check if frog has landed on a finishing spot
      // checkFinishSpot takes in a Body and logBody state which calculates to see if the frog is anywhere inside the finish spot
      const checkFinishSpot = ([a,b]: [Body,logBody]) => (a.pos.x + a.radius < b.pos.x + b.length) && (a.pos.x - a.radius > b.pos.x) && (a.pos.y - a.radius === b.pos.y);
      const frogOnFinish = state.finishSpots.filter((spot) => checkFinishSpot([state.frog,spot]));
      const finishCollision = frogOnFinish.length;

      // check if frog has landed on fly
      const checkCollisionFly = ([a,b]: [Body,Body]) => a.pos.sub(b.pos).len() < a.radius + b.radius;
      const Fly = state.fly.filter((fly) => checkCollisionFly([state.frog,fly]));
      const collisionFly = Fly.length > 0;

      ////////////////////////////
      // FINISH LINE COLLISION //
      ////////////////////////////
      if (finishCollision) {
        const svgFinishSpot = document.getElementById(frogOnFinish[0].id);
        const svgFly = document.getElementById(Fly[0].id);
        if (svgFinishSpot?.getAttribute("visibility") === "hidden") { // if finish spot has already been completed
          return restartGame(state);
        }
        if (collisionFly && svgFly?.getAttribute("visibility") === "visible") { // if collision with fly
          return restartGame(state);
        }
        svgFinishSpot?.setAttribute("visibility", "hidden"); // else correctly landed on a finish spot and make it hidden

        // check if all finish spots are hidden
        function checkIfFinished(o: logBody) {
        const finishSpot = document.getElementById(o.id);
        return finishSpot?.getAttribute("visibility") === "hidden";
        }
        let finishedSpots = 0;
        state.finishSpots.forEach((o: logBody) => {
          if (checkIfFinished(o)) {
            finishedSpots += 1
          }
        });
        // finish round
        if (finishedSpots === 3) {
          state.finishSpots.forEach((o:logBody) => {
            const spot = document.getElementById(o.id);
            spot?.setAttribute("visibility", "visible");
          });
          // return an instance of a new round with 20% faster moving objects and icnrease scroe by 200
          return <State>{
            frog: createFrog(),
            car1: startCar1(state.car1[0].vel.x * 1.2),
            car2: startCar2(state.car2[0].vel.x * 1.2),
            car3: startCar3(state.car3[0].vel.x * 1.2),
            car4: startCar4(state.car4[0].vel.x * -1.2), // a negative is needed as otherwise the direction of movement is reversed
            log1: startLog1(state.log1[0].vel.x * 1.2),
            log2: startLog2(state.log2[0].vel.x * -1.2), // a negative is needed as otherwise the direction of movement is reversed
            log3: startLog3(state.log3[0].vel.x * 1.2),
            turtle1: startTurtle1(state.turtle1[0].vel.x * 1.2),
            turtle2: startTurtle2(state.turtle2[0].vel.x * 1.2),
            fly: startFly,
            finishSpots: startFinishSpots,
            score: state.score + 200
          }
        } else { // not all finish spots are complete, reset frog position and increment score by 100
          return <State>{
            ...state,
            frog: {
              ...state.frog,
              pos: new Vector(275, 575),
              maxY: 575
            },
            score: state.score + 100
          }
        }
      } 
      else if (state.frog.pos.y - state.frog.radius === 0) { //frog is on the finish banner
        return restartGame(state)
      }
      
      /////////////////////
      //// LOG COLLISION //
      /////////////////////
      if (logCollision1) { // frog is on row 1 of logs
        return <State>{
          ...state,
          frog: moveFrogWObj(state.frog, state.log1[0])
        }
      } else if (logCollision2) { // frog is on row 2 of logs
        return <State>{
          ...state,
          frog: moveFrogWObj(state.frog, state.log2[0])
        }
      } else if (logCollision3) { // frog is on row 3 of logs
        return <State>{
          ...state,
          frog: moveFrogWObj(state.frog, state.log3[0])
        }
      } else if (turtleCollision1) { //// TURTLE COLLISION ////
        // check if standing on only 1 turtle, if so check if this is hidden with its id
        // else if standing on two turtles, check if there is 2 turtles hidden
        // if either of these are true end game
        // else move frog with turtle.
        if (frogOnTurtle1.length === 1) {
          const svgTurtle = document.getElementById(frogOnTurtle1[0].id);
          if (svgTurtle?.getAttribute("visibility") === "hidden") {
            return restartGame(state)
          } else {
            return <State>{
              ...state,
              frog: moveFrogWObj(state.frog, state.turtle1[0])
            }
          }
        } else {
          const svgTurtle1 = document.getElementById(frogOnTurtle1[0].id);
          const svgTurtle2 = document.getElementById(frogOnTurtle1[1].id);
          if (svgTurtle1?.getAttribute("visibility") === "hidden" && svgTurtle2?.getAttribute("visibility") === "hidden") {
            return restartGame(state)
          } else {
            return <State>{
              ...state,
              frog: moveFrogWObj(state.frog, state.turtle1[0])
            }
          }
        }
      } else if (turtleCollision2) {
        if (frogOnTurtle2.length === 1) {
          const svgTurtle = document.getElementById(frogOnTurtle2[0].id);
          if (svgTurtle?.getAttribute("visibility") === "hidden") {
            return restartGame(state)
          } else {
            return <State>{
              ...state,
              frog: moveFrogWObj(state.frog, state.turtle1[0])
            }
          }
        } else {
          const svgTurtle1 = document.getElementById(frogOnTurtle2[0].id);
          const svgTurtle2 = document.getElementById(frogOnTurtle2[1].id);
          if (svgTurtle1?.getAttribute("visibility") === "hidden" && svgTurtle2?.getAttribute("visibility") === "hidden") {
            return restartGame(state)
          } else {
            return <State>{
              ...state,
              frog: moveFrogWObj(state.frog, state.turtle1[0])
            }
          }
        }
      }
      
      //////////////////////////////////////
      //// CAR COLLISION & WATER COLLISION//
      //////////////////////////////////////
      const upperBoundY = state.log1[0].pos.y + state.frog.radius;
      const lowerBoundY = state.log3[0].pos.y - state.frog.radius;
      if (carCollision1 || carCollision2 || carCollision3 || carCollision4) { // if collision with any car restart game
        return restartGame(state);
      } else if ((!logCollision1 || !logCollision2 || !logCollision3) && (state.frog.pos.y <= upperBoundY &&  state.frog.pos.y >= lowerBoundY)) {
        // Standing in the water
        return restartGame(state);
      } else {
        return <State>{
          ...state
        }
      }
    };

    /* canvasWrap brings the car, log or turtle to the other side of the screen once it has dissapeared through one side.
    Input: x and y position object with the width of the object
    Output: a new position vector where the object stays where it is or returns on the other side.
    */
    const canvasWrap = ({x,y}: Vector, width: number) => {
      const canvasSize = 600;
      const loop = (num: number) => num + width < 0 ? num + canvasSize : num > canvasSize ? num - canvasSize : num;
      return new Vector(loop(x), y);
    }

    // move the car
    const moveCar = (o: Body) => <Body>{
      ...o,
      pos: canvasWrap(o.pos.sub(o.vel), o.radius)
    };

    // move the log
    const moveLog = (o: logBody) => 
    <logBody>{
      ...o,
      pos: canvasWrap(o.pos.sub(o.vel), o.length)
    }

    // check if the new position of each object is colliding with the frog
    const moveObjects = (state: State) => {
      return collisionDetect({
        ...state,
        car1: state.car1.map(moveCar),
        car2: state.car2.map(moveCar),
        car3: state.car3.map(moveCar),
        car4: state.car4.map(moveCar),
        log1: state.log1.map(moveLog),
        log2: state.log2.map(moveLog),
        log3: state.log3.map(moveLog),
        turtle1: state.turtle1.map(moveCar),
        turtle2: state.turtle2.map(moveCar)
      });
    };
    
    // every 10ms, get all inputs from user and move accordingly in Move, then update the game in updateView
    interval(10).pipe(
      merge(keyObservable),
      scan(Move, initialState)
    ).subscribe(updateView);

    // update view takes in InitialState and updates the visual position of each object according to the changes made so far
    function updateView(state: State): void {
      const svg = document.getElementById("svgCanvas")!;

      // create the finish line
      const createFinishLine = () => {
        const view = document.createElementNS(svg.namespaceURI, "rect")!;
        view.setAttribute("id", "finishLine");
        view.setAttribute("height", String(50));
        view.setAttribute("width", String(600));
        view.setAttribute("class", "FinishLine");
        svg.appendChild(view);
        return view;
      }
      if (document.getElementById("finishLine") === null) {
        createFinishLine();
      }

      // update the position of car and create it if not done
      const updateCar = (car: Body) => {
        function createCarBody() {
          const view = document.createElementNS(svg.namespaceURI, "ellipse")!;
          view.setAttribute("id", car.id);
          view.setAttribute("rx", String(car.radius));
          view.setAttribute("ry", String(car.radius));
          view.classList.add(car.viewType);
          svg.appendChild(view);
          return view;
        }
        const view = document.getElementById(car.id) || createCarBody();
        view.setAttribute("cx", String(car.pos.x));
        view.setAttribute("cy", String(car.pos.y));
      };
      state.car1.forEach(updateCar);
      state.car2.forEach(updateCar);
      state.car3.forEach(updateCar);
      state.car4.forEach(updateCar);

      // update position of each log and create it if not done
      const updateLog = (log: logBody) => {
        function createLogBody() {
          const view = document.createElementNS(svg.namespaceURI, "rect")!;
          view.setAttribute("id", log.id);
          view.setAttribute("height", String(log.height));
          view.setAttribute("width", String(log.length));
          view.classList.add(log.viewType);
          svg.appendChild(view);
          return view;
        }
        const view = document.getElementById(log.id) || createLogBody();
        view.setAttribute("y", String(log.pos.y));
        view.setAttribute("x", String(log.pos.x));
      };
      state.log1.forEach(updateLog);
      state.log2.forEach(updateLog);
      state.log3.forEach(updateLog);

      // update position of turtle and create it if not done
      const updateTurtle = (turtle: Body) => {
        function createTurtleBody() {
          const view = document.createElementNS(svg.namespaceURI, "ellipse")!;
          view.setAttribute("id", turtle.id);
          view.setAttribute("rx", String(turtle.radius));
          view.setAttribute("ry", String(turtle.radius));
          view.classList.add(turtle.viewType);
          svg.appendChild(view);
          return view;
        }
        // get the turtle via id or create the turtle if it has not been created yet
        const view = document.getElementById(turtle.id) || createTurtleBody();
        view.setAttribute("cx", String(turtle.pos.x));
        view.setAttribute("cy", String(turtle.pos.y));    

        // if chosen to be hidden make visibility hidden for 1000ms
        const randomNum = Math.random();
        if (randomNum <= 0.0019 && turtle.timer === 0) { // change the opacity to 0.4 for 600ms
          view.setAttribute("opacity", "0.4");
          turtle.timer += 1;
        } else if (turtle.timer > 0) {
            if (turtle.timer <= 60) {
              turtle.timer += 1;
            } else {
              turtle.timer += 1;
              view.setAttribute("visibility", "hidden");

              if (turtle.timer >= 160) {
                view.setAttribute("visibility", "visible");
                view.setAttribute("opacity", "1");
                turtle.timer = 0
              }
            }          
        }

      }
      state.turtle1.forEach(updateTurtle);
      state.turtle2.forEach(updateTurtle);

      // create the finish spots
      const placeFinishSpots = (spot: logBody) => {
        const view = document.createElementNS(svg.namespaceURI, "rect")!;
        view.setAttribute("id", spot.id);
        view.setAttribute("height", String(spot.height));
        view.setAttribute("width", String(spot.length));
        view.setAttribute("y", String(spot.pos.y));
        view.setAttribute("x", String(spot.pos.x));
        view.setAttribute("visibility", "visible");
        view.setAttribute("class", "FinishSpots");
        svg.appendChild(view);
        return view;
      }
      if (document.getElementById(state.finishSpots[0].id) === null) {
        state.finishSpots.forEach(placeFinishSpots);
      };

      // create the flies
      const updateFly = (fly: Body) => {
        function createFly() {
          const view = document.createElementNS(svg.namespaceURI, "ellipse")!;
          view.setAttribute("id", fly.id);
          view.setAttribute("rx", String(fly.radius));
          view.setAttribute("ry", String(fly.radius));
          view.setAttribute("cx", String(fly.pos.x));
          view.setAttribute("cy", String(fly.pos.y));
          view.setAttribute("visibility", "hidden")
          view.classList.add(fly.viewType);
          svg.appendChild(view);
          return view;
        };
        const view = document.getElementById(fly.id) || createFly();
        const randomNum = Math.random();

        // if randomNum < 0.001 make the fly visible for 4000ms
        if (randomNum < 0.001 && fly.timer === 0) {
          view.setAttribute("visibility", "visible")
          fly.timer += 1
        } else if (fly.timer > 0 && fly.timer < 400) {
          fly.timer += 1
        } else {
          view.setAttribute("visibility", "hidden")
          fly.timer = 0
        }
      };
      state.fly.forEach(updateFly);

      // update the position of the frog
      const updateFrog = (frog: Body) => {
        function createFrog() {
          const view = document.createElementNS(svg.namespaceURI, "circle")!;
          view.setAttribute("id", "frog");
          view.setAttribute("r", String(frog.radius));
          view.classList.add("Frog");
          svg.appendChild(view);
          return view
        }
        const view = document.getElementById(frog.id) || createFrog();
        view.setAttribute("transform", `translate(${state.frog.pos.x},${state.frog.pos.y})`);
      }
      updateFrog(state.frog);

      // print the updated score
      const printScore = (score: number) => {
        const view = document.createElementNS(svg.namespaceURI, "text")!;
        view.setAttribute("id", "score")
        view.setAttribute("x", "25");
        view.setAttribute("y", "580");
        view.classList.add("Score")
        view.textContent = `Score: ${score}`;
        svg.appendChild(view);
      };
      const score = document.getElementById("score")
      if ( score === null) {
        printScore(state.score);
      } else {
        score.textContent = `Score: ${state.score}`;
      }
    }
  }
  setTimeout(frogger, 0) // call the fucntion frogger to start game.
}

// Defining vector class allowing for position and velocity to be easily manipulated
class Vector {
  constructor(public readonly x: number = 0, public readonly y: number = 0) {}
  add = (o: Vector) => new Vector(this.x + o.x, this.y + o.y) // adding the x and y coordinates of two Vector variables
  sub = (o: Vector) => new Vector(this.x - o.x, this.y - o.y) // subtracting the x and y coordinates of two Vector variables
  len = () => Math.sqrt(this.y*this.y + this.x*this.x) // getting the length of Vector relative to origin.
  static Zero = new Vector() // defining a Vector with x and y being 0
};

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
