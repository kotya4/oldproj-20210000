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
    //       now only literals will be dropped.
    for ( let i = 0; i >= 0; ) {
      i = vs.findIndex ( e => e === ',' );
      if ( i > 0 ) {
        const e = vs[ i - 1 ];
        if ( e instanceof Array || legal_literals.indexOf ( e ) >= 0 ) {
          vs.splice ( i - 1, 2 );
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


  function interpret ( vectors, stack, waterfall=[] ) {
    // waterfall usage example:
    // ea(b(c++)++) -> e,a,(b,([a+[b+c]])++) -> e,a,(a+[b+([a+[b+c]])])

    for ( let i = 0; i < vectors.length; ++i ) {
      const p = vectors[ i ];

      let lit; // buffer for calc. literals

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
        stack.push ( v );
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

    // method 1: strict normalization
    // const min = Math.min ( ...values );
    // const max = Math.max ( ...values );
    // if ( 0 <= min && min <= 1 && 0 <= max && max <= 1 ) return values;
    // const eps = 0;
    // return values.map ( e => ( e - ( min - eps ) ) / ( max - min + eps ) );

    // method 2: cutting
    // return values.map ( e => Math.max ( 0, Math.min ( 1, e ) ) );

    // method 3: overflow
    return values.map ( e => {
      const a = Math.abs ( e );
      return ( a > 1.0 ) ? a % 1.0 : a;
    } );

  }


  // Converts stack into valid array :
  // rules: [stack] -> [values]
  // e,a,b,c -> a,b,c                   -- only last 3 values are needed
  // a,b -> a,a,b                       -- if values not enough then fill w/ FIRST value
  // -> 0, 0, 0                         -- empty stack returns zeros
  // (),(),(),(),() -> 0, 0, 0          -- all empty vectors ignored
  // e,(a,b,c,d) -> a,b,c               -- prefer vector if last value is non-empty vector
  // e,(a,b) -> a,b,b                   -- last-valued non-empty vector filled w/ LAST value
  // a,(),b,() -> a,a,b                 -- empty vectors always ignored
  // e,a,(b,c),c -> a,(b+c)/2,c         -- if vector is not last-valued then calc. arithm. meaning
  // (a,b,(c,d)),e,f -> (a+b+c+d)/4,e,f -- nested non-last-valued vectors are flatted before calc.
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

    return flat_and_normalize ( values.reverse () );
  }

}
