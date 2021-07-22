const sprungue = {};

{

  sprungue.interpret = interpret;
  sprungue.remove_comments = remove_comments;
  sprungue.new_stack = new_stack;


  function remove_comments ( program ) {

    console.log ( 'TODO: remove_comments removes only certain type of comments' );

    let index = 0;
    let inf = 0xff;
    for ( ; inf >= 0; --inf ) {

      index = program.indexOf ( '),', index );
      if ( index < 0 ) break;

      let depth = 0;
      let i = index - 1;
      for ( ; i >= 0; --i ) {
        if ( program[ i ] === ')' ) depth++;
        else if ( program[ i ] === '(' ) {
          if ( depth > 0 ) depth--;
          else if ( depth === 0 ) break;
        }
      }

      // replacing comment with spaces because
      // want to save program length as is for debugging
      program = program.slice ( 0, i )
              + ' '.repeat( index + 2 - i )
              + program.slice ( index + 2 ) ;
    }

    if ( inf < 0 ) {
      console.log ( 'sprungue: inf is negative' );
    }

    return program;
  }



  class Stack {
    constructor ( parent, stack ) {
      this.parent = parent;
      this.stack = stack;
      this.offset = [];
    }
  };


  function new_stack ( parent, stack ) {
    return new Stack( parent, stack );
  }



  function try_copy_value_from ( stack, depth=0 ) {
    if ( stack == null ) {
      // WARN: main stack is empty
      return 0; // return identity
    }
    if ( stack.offset.length <= depth ) {
      // find last value
      const lo = stack.offset.length - 1 >= 0 ? stack.offset[ stack.offset.length - 1 ] : 0;
      // populate offsets with initial values
      // for ( let i = 0; i <= depth - stack.offset.length; ++i ) {
      //   stack.offset.push ( lo );
      // }
      stack.offset.push ( lo );
    }
    const i = stack.stack.length - stack.offset[ depth ] - 1;
    if ( i >= 0 ) { // value exists
      stack.offset[ depth ]++;
      return copy_value_of ( stack.stack[ i ] ); // return value
    }
    // not enough values in stack, need value from parent
    return try_copy_value_from ( stack.parent, depth + 1 ); // get value from parent
  }


  function pop_value_from ( stack ) {
    if ( stack.stack.length > 0 ) { // there is exists value
      const v = stack.stack[ stack.length - 1 ];
      stack.stack.pop ();
      return v; // pop value from stack
    }
    // no value in current stack
    return try_copy_value_from ( stack.parent ); // get value from parent
  }









  function interpret ( program, stack ) {

    for ( let i = 0; i < program.length; ++i ) {

      const p = program[ i ];

      if ( p >= '0' && p <= '9' || p >= 'a' && p <= 'f' ) {
        let v;
        if ( p >= '0' && p <= '9' ) v = p.charCodeAt ( 0 ) - '0'.charCodeAt ( 0 );
        else v = p.charCodeAt ( 0 ) - 'a'.charCodeAt ( 0 ) + 10;
        stack.stack.push ( v );
      }

      else if ( p === '/' ) {
        const v1 = pop_value_from ( stack );
        const v2 = pop_value_from ( stack );

        // TODO: nested arrays
        if ( v1 instanceof Stack && v2 instanceof Stack ) { // e(ab)(cd)/ -> e,(a/c,b/d)
          if ( v2.stack.length > v1.stack.length ) { // e(ab)(c) -> e,(a/c,b/1)
          }
          else if ( v2.stack.length < v1.stack.length ) { // e(a)(bc) -> e,(a/b,1/c)
          }
          // TODO:
          stack.stack.push ( 0 );
        }
        else if ( v1 instanceof Stack ) { // ea(bc)/ -> e,(a/b,a/c)
          // TODO:
          stack.stack.push ( 0 );
        }
        else if ( v2 instanceof Stack ) { // e(bc)a/ -> e,(b/a,c/a)
          // TODO:
          stack.stack.push ( 0 );
        }
        else { // eab/ -> e,a/b
          stack.stack.push ( v2 / v1 );
        }
      }

      else if ( p === '(' ) {
        stack = new_stack ( stack, [] );
      }

      else if ( p === ')' ) {
        // remove all offsets made by stack
        for ( let s = stack.parent; s != null; s = s.parent ) {
          s.offset.pop ();
        }
        // set parent as current stack
        if ( stack.parent ) {
          stack.parent.stack.push ( stack );
          stack = stack.parent;
        }
        else {
          // WARN: main stack was closed
          stack = new_stack ( null, [] );
        }
      }

      else if ( p === 'x' ) {
        const v = pop_value_from ( stack );
        if ( v instanceof Stack ) {
          if ( v.stack.length > 0 ) {
            stack.stack.push ( v.stack[ 0 ] );
          } else {
            stack.stack.push ( 0 );
          }
        }
        else {
          stack.stack.push ( v );
        }
      }

      else if ( p === '.' ) {
        if ( stack.stack.length > 0 ) {
          stack.stack.push ( copy_value_of ( stack.stack[ stack.stack.length - 1 ] ) );
        }
        else {
          stack.stack.push ( 0 );
        }
      }

      else if ( p === '^' ) {
        const v1 = pop_value_from ( stack );
        const v2 = pop_value_from ( stack );
        if ( v1 instanceof Stack ) { // ea(bc)^ -> e(abc)
          v1.stack.unshift ( v2 );
          stack.stack.push ( v1 );
        }
        else { // eab^ -> e(ab)
          stack.stack.push ( [ v2, v1 ] );
        }
      }
    }

    // console.log(stack);

    // return null;

    if ( stack.stack.length > 0 ) {
      const v = stack.stack[ stack.stack.length - 1 ];
      if ( v instanceof Stack ) {
        if ( v.stack.length >= 3 ) {
          if ( v.stack.slice( 0, 3 ).every ( e => ! ( e instanceof Stack ) ) ) {
            return v.stack;
          }
        }
      }
    }

    return [ 1, 0, 1 ];
  }




  function copy_value_of ( stack_or_value, parent=null ) {
    if ( parent == null ) parent = stack_or_value.parent;
    if ( stack_or_value instanceof Stack ) {
      const s = new Stack ();
      s.parent = parent;
      s.stack = stack_or_value.stack.map ( e => copy_value_of ( e, s ) );
      return s;
    } else {
      return stack_or_value;
    }
  }




  // function copy_array ( a ) {
  //   if ( a instanceof Array ) {
  //     return a.map ( copy_value_of );
  //   } else {
  //     return a;
  //   }
  // }
}



/*
const s1 = sprungue.new_stack ( null, [] );
    const s2 = sprungue.new_stack ( s1, [ x, y, 0 ] );
    s1.stack.push ( s2 );

    const sstack = s1;
    const rgb = sprungue.interpret ( sprog, sstack );
    if ( rgb == null ) {
      console.log ( 'rgb is null' );
      return;
    }
    */





