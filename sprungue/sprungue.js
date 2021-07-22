const sprungue = {};

{

  sprungue.clear = clear;
  sprungue.split = split;
  sprungue.drop = drop;
  sprungue.interpret = interpret;
  sprungue.validify = validify;


  function print ( ...args ) {
    console.log ( args.join ( ' ' ) );
  }


  function copy ( a ) {
    if ( a instanceof Array ) {
      return a.map ( copy );
    } else {
      return a;
    }
  }


  const legal_literals = '0123456789abcdef';
  const legal_operators = '.,()xyz+-*/^!~';

  function clear ( program ) {
    const legal = legal_operators + legal_literals;
    return program.split('').filter( e => legal.indexOf ( e ) >= 0 ).join ('');
  }


  function split ( program ) {
    let vs = [];
    let depth = 0;
    let istart = -1;
    for ( let i = 0; i < program.length; ++i ) {
      // vector starts
      if ( program[ i ] === '(' ) {
        if ( depth === 0 ) istart = i;
        depth++;
      }
      // vector ends
      else if ( program[ i ] === ')' ) {
        depth--;
        if ( depth === 0 ) {
          vs.push ( split ( program.slice ( istart + 1, i ) ) );
          istart = i;
        }
        // unexpected vector end
        else if ( depth < 0 ) {
          depth = 0;
          vs = [ vs ];
        }
      }
      // other commands
      else if ( depth === 0 ) {
        vs.push ( program[ i ] );
      }
    }
    // vector has no end
    if ( depth > 0 ) {
      vs.push ( split ( program.slice ( istart + 1 ) ) );
    }
    return vs;
  }


  function drop ( vs ) {
    // TODO: can be impoved if i build an operating tree,
    for ( let i = 1; i < vs.length; ++i ) {
      if ( vs[ i ] === ',' ) {
        const e = vs[ i - 1 ];
        if ( e instanceof Array || legal_literals.indexOf ( e ) >= 0 ) {
          vs.splice ( i - 1, 2 );
          i -= 1;
        }
      }
    }
    return vs;
  }


  function literal ( p ) {
    if ( '0' <= p && p <= '9' ) return p.charCodeAt ( 0 ) - '0'.charCodeAt ( 0 );
    else if ( 'a' <= p && p <= 'f' ) return 10 + p.charCodeAt ( 0 ) - 'a'.charCodeAt ( 0 );
    return null;
  }


  function pop ( stack, waterfall, identity=0 ) {
    let v;
    if ( ( v = stack.pop () ) != null ) return copy ( v );
    if ( ( v = waterfall.pop () ) != null ) return copy ( v );
    return copy ( identity );
  }




  function arithmetics ( v2, v1, func, identity, incomm=null ) {
    if ( v2 instanceof Array && v1 instanceof Array ) { // vector + vector
      // right-hand induction ( v1.length is prime )
      if ( v2.length < v1.length ) {
        v2 = [ ...Array( v1.length - v2.length ).fill( identity ), ...v2 ];
      }
      // right-hand reduction ( v1.length is prime )
      return v1.map ( (_,i) => arithmetics ( v2[ i ], v1[ i ], func, identity, incomm ) );
    }
    else if ( v2 instanceof Array ) { // vector + value
      // e(ab)c+ -> e,(a+c,b+c)
      if ( v2.length > 0 ) {
        return v2.map ( (_,i) => arithmetics ( v2[ i ], v1, func, identity, incomm ) );
      }
      // e()a+ -> e,(a)
      else {
        return [ func ( identity, v1 ) ];
      }
    }
    else if ( v1 instanceof Array ) { // value + vector
      if ( incomm == null ) { // pseudocommutative
        // ea(bc)+ -> e,[[a+b]+c]
        // ea()+ -> e,a
        // fe: 0(abcd)+ === ab+c+d+ ; abcd3{+} === abcd+++ ; ab+c+d+ !== abcd+++
        return v1.reduce ( (a,c) => arithmetics ( a, c, func, identity, incomm ), v2 );
      }
      else { // incommutative
        // ea(bc)- -> e,(a-b,a-c)
        // fe: 0(abcd)- === (abcd)4{.x~v~0-~}3{^} -> (-a,-b,-c,-d)
        if ( v1.length > 0 ) {
          return v1.map ( (_,i) => arithmetics ( v2, v1[ i ], func, identity, incomm ) );
        }
        // ea()- -> e,(a)
        else {
          return [ func ( v2, identity ) ];
        }
      }
    }
    else { // value + value
      // eab+ -> e,a+b
      return func ( v2, v1 );
    }
  }





  function interpret ( vprogram, stack, waterfall=[] ) {
    // waterfall usage example:
    // ea(b(c++)++) -> e,a,(b,([a+[b+c]])++) -> e,a,(a+[b+([a+[b+c]])])

    for ( let i = 0; i < vprogram.length; ++i ) {
      const p = vprogram[ i ];

      let lit; // buffer for calc. literals inlinely

      // vector
      if ( p instanceof Array ) {
        const wf = [ ...waterfall, ...stack ];
        stack.push ( interpret ( p, [], wf ) );
      }
      // literal
      else if ( ( lit = literal ( p ) ) != null ) {
        stack.push ( lit );
      }
      // first element of vector
      else if ( p === 'x' ) {
        const identity = 0;
        const v = pop ( stack, waterfall, identity );
        if ( v instanceof Array ) { // vector
          if ( v.length >= 1 ) {
            stack.push ( v[ 0 ] );
          }
          else { // vector is empty
            stack.push ( identity );
            // WARN: empty vector
          }
        }
        else { // value
          stack.push ( v );
        }
      }
      // second element of vector
      else if ( p === 'y' ) {
        const identity = 0;
        const v = pop ( stack, waterfall, identity );
        if ( v instanceof Array ) { // vector
          if ( v.length >= 2 ) {
            stack.push ( v[ 1 ] );
          }
          else { // vector is empty
            stack.push ( identity );
            // WARN: empty vector
          }
        }
        else { // value
          stack.push ( identity );
          // WARN: cannot get y from value
        }
      }
      // third element of vector
      else if ( p === 'z' ) {
        const identity = 0;
        const v = pop ( stack, waterfall, identity );
        if ( v instanceof Array ) { // vector
          if ( v.length >= 3 ) {
            stack.push ( v[ 2 ] );
          }
          else { // vector is empty
            stack.push ( identity );
            // WARN: empty vector
          }
        }
        else { // value
          stack.push ( identity );
          // WARN: cannot get z from value
        }
      }
      // copy
      else if ( p === '.' ) {
        const identity = 0;
        const v = pop ( stack, waterfall, identity );
        // special case for waterfall
        // if no values in current vector then push value only once
        // i.e.: ea(.) -> e,a,(a); NOT e,a,(a,a)
        if ( stack.length !== 0 ) {
          stack.push ( v );
        }
        stack.push ( v );
      }
      // glue
      else if ( p === '^' ) {
        const identity = 0;
        const v1 = pop ( stack, waterfall, identity );
        const v2 = pop ( stack, waterfall, identity );
        if ( v1 instanceof Array ) { // ea(bc)^ -> e(abc)
          v1.unshift ( v2 );
          stack.push ( v1 );
        }
        else { // eab^ -> e(ab)
          stack.push ( [ v2, v1 ] );
        }
      }
      // swap
      else if ( p === '~' ) {
        const identity = 0;
        const v1 = pop ( stack, waterfall, identity );
        const v2 = pop ( stack, waterfall, identity );
        stack.push ( v1 );
        stack.push ( v2 );
      }
      // drop
      else if ( p === ',' ) {
        pop ( stack, waterfall );
      }
      // shift
      else if ( p === 'v' ) {
        const identity = 0;
        let v = pop ( stack, waterfall, identity );
        if ( v instanceof Array ) {
          // e(abc)v -> e,(b,c)
          // e()v -> e,()
          v.shift ();
        }
        else {
          // eav -> e0
          // v -> 0
          v = identity;
        }
        stack.push ( v );
      }
      // add
      else if ( p === '+' ) {
        const identity = 0;
        let v1 = pop ( stack, waterfall, identity );
        let v2 = pop ( stack, waterfall, identity );
        stack.push ( arithmetics ( v2, v1, (a,b) => a + b, identity ) );
      }
      // mul
      else if ( p === '*' ) {
        const identity = 1;
        let v1 = pop ( stack, waterfall, identity );
        let v2 = pop ( stack, waterfall, identity );
        stack.push ( arithmetics ( v2, v1, (a,b) => a * b, identity ) );
      }
      // sub
      else if ( p === '-' ) {
        const identity = 0;
        let v1 = pop ( stack, waterfall, identity );
        let v2 = pop ( stack, waterfall, identity );
        stack.push ( arithmetics ( v2, v1, (a,b) => a - b, identity, 'incommutative' ) );
      }
      // div
      else if ( p === '/' ) {
        const identity = 1;
        let v1 = pop ( stack, waterfall, identity );
        let v2 = pop ( stack, waterfall, identity );
        if ( v1 !== 0 ) {
          stack.push ( arithmetics ( v2, v1, (a,b) => a / b, identity, 'incommutative' ) );
        } else {
          stack.push ( arithmetics ( v2, 0, (a,b) => a * b, identity, 'incommutative' ) );
          // WARN: division by zero
        }
      }
    }

    return stack;
  }













  function flat_and_normalize ( values ) {
    // arithmetic mean of flatted vectors
    for ( let i = 0; i < values.length; ++i ) {
      if ( values[ i ] instanceof Array ) {
        const a = values[ i ].flat ( Infinity );
        const len = a.length;
        values[ i ] = a.reduce ( (a,c) => a + c, 0 ) / len;
      }
    }

    // method 1: simple cut
    // return values.map ( e => Math.max ( 0, Math.min ( 1, e ) ) );

    // method 2: fancy mod/minmax
    const first = values[ 0 ];
    // overflow if values are same
    if ( values.every ( e => e === first ) ) {
      const a = Math.abs ( first );
      if ( a === 0 ) return [ 0, 0, 0 ]; // treat zero as zeros
      const mod = a % 1.0;
      if ( mod === 0 ) return [ 1, 1, 1 ]; // treat mod 1 === 0 as 1s
      return mod; // treat as mod overwise
    }
    // overwise normalize values berween 0 and 1
    const min = Math.min ( ...values );
    const max = Math.max ( ...values );
    // no need for normalization
    if ( 0 <= min && min <= 1 && 0 <= max && max <= 1 ) return values;
    // normalize
    const edge = 0; // tldr; can be 0 or 1, on big thresholds does no effect
    return values.map ( e => ( e - ( min - edge ) ) / ( max - min + 1 ) );
  }


  // Converts stack into valid array :
  // rules written as [stack] -> [values]
  // e,a,b,c -> c,b,a                   -- only last 3 values are needed
  // a,b -> b,a,a                       -- if values not enough then fill w/ FIRST value
  // -> 0, 0, 0                         -- empty stack returns zeros
  // (),(),(),(),() -> 0, 0, 0          -- all empty vectors ignored
  // e,(a,b,c,d) -> a,b,c               -- prefer vector if last value is non-empty vector
  // e,(a,b) -> a,b,b                   -- last-valued non-empty vector filled w/ LAST value
  // a,(),b,() -> b,a,a                 -- empty vectors always ignored
  // e,a,(b,c),c -> c,(b+c)/2,a         -- if vector is not last-valued then calc. arithm. meaning
  // (a,b,(c,d)),e,f -> f,e,(a+b+c+d)/4 -- nested non-last-valued vectors are flatted before calc.
  // All values will be normalized from 0 to 1 using preferred method.
  function validify ( values_len, stack ) {

    // if stack is empty then return zeros
    if ( stack.length === 0 ) return [ 0, 0, 0 ];

    const values = [];

    let v = stack[ stack.length - 1 ];

    // if last value in stack is vector
    if ( v instanceof Array ) {
      // and vector is not empty
      if ( v.length > 0 ) {
        // use values of vector as data,
        // if not enough then copy last value to fill all space
        for ( let i = 0; i < values_len; ++i ) {
          values.push ( ( i < v.length ) ? v[ i ] : v[ v.length - 1 ] );
        }
        return flat_and_normalize ( values );
      }
    }

    // if last value in stack is literal
    for ( let vi = 0; vi < values_len; ++vi) {
      v = stack.pop ();

      // out of stack
      if ( v == null ) {
        // propagate last parsed value
        for ( let i = vi; i < values_len; ++i ) {
          values.push ( ( vi > 0 ) ? values[ vi - 1 ] : 0 );
        }
        break;
      }

      // v is vector
      else if ( v instanceof Array ) {
        // if vector is empty then go to next value
        if ( v.length === 0 ) {
          vi--;
          continue;
        }
        values.push ( v );
      }

      else {
        // v is literal
        values.push ( v );
      }

    }

    return flat_and_normalize ( values ); // TIP: reverse values to make them NOT reversed
  }

}
