grammar StatemachineModel

/** A textual representation of a state machine */
entry Statemachine:
    'statemachine'
    /** The name of the machine */
    name=ID
    ('events'
        /** The list of recognized event names */
        events+=Event+)?
    ('commands'    commands+=Command+)?
    'initialState'
    /** The starting state for the machine */
    init=[State]
    /** Definitions of available states */
    states+=State*;

/** An event is the trigger for a transition */
Event:
    name=ID;

Command:
    name=ID;

/** A description of the status of a system */
State:
    'state' name=ID
        ('actions' '{' actions+=[Command]+ '}')?
        /** The transitions to other states that can take place from the current one */
        transitions+=Transition*
    'end';

/** A change from one state to another */
Transition:
    /** The event triggering the transition */
    event=[Event] '=>'
    /** The target state */
    state=[State];

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
