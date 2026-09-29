// Each repo declares its own closed list in refs/ldd/config; this list applies until it does.
export const DEFAULT_AREAS = ['fe', 'be', 'db', 'infra']         

                             
                  
                 
 

                           
            
              
                  
                                                                                            
                             
                                                                                                       
                
 

// A question the human has settled. The answer is theirs: an accepted proposal or their own words.
                           
            
                  
                
                            
                
 

export const RELATION_TYPES = ['blocks', 'duplicates', 'parent']         
                                                          

// Stored on one side only; the other side sees it through incomingLinks.
                           
                    
                
 

// A link that another intent holds to this one, found by scanning the plan refs.
                               
              
                                                      
                                                                          
               
             
 

                         
                  
            
                
               
                 
                 
                 
                      
                                                                 
                                               
                        
                           
                        
 

export const STEP_KINDS = ['data-shape', 'signature-change', 'behavior-change', 'feature', 'instructions', 'docs', 'non-semantic', 'other']         
                                                  

// Prose kinds name files and sections; code kinds name symbols.
export const PROSE_KINDS                      = ['instructions', 'docs', 'non-semantic']

// One shared list, so a word means the same thing in every kind (docs/model/categories.md).
export const CHANGE_CATEGORIES = [
  'added',
  'removed',
  'renamed',
  'moved',
  'type-changed',
  'nullability-changed',
  'value-changed',
  'behavior-changed',
  'content-changed',
]         
                                                               

// The categories each kind can produce; any other category on a change of that kind is a mislabel.
export const KIND_CATEGORIES                                              = {
  'data-shape': ['added', 'removed', 'renamed', 'type-changed', 'nullability-changed'],
  'signature-change': ['added', 'removed', 'renamed', 'type-changed'],
  'behavior-change': ['behavior-changed', 'value-changed'],
  feature: ['added'],
  instructions: ['added', 'removed', 'moved', 'behavior-changed'],
  docs: ['added', 'removed', 'moved', 'content-changed'],
  'non-semantic': ['moved', 'renamed', 'content-changed'],
  other: CHANGE_CATEGORIES,
}

export const RISKS = ['low', 'medium', 'high']         
                                         

// Prose can't be checked by machine, so it always says who checks it.
                        
              
                             
 

// For prose the file is the identity: doc is a skill's name or a repo-relative path, section is the heading text.
                             
             
                 
 

                            
                
               
                    
               
             
 

// Symbol lists are what reconciliation checks against the observed diff; rules and invariants are prose.
                         
                   
                   
                      
                      
                         
                 
                      
 

export const EXPECT_FIELDS = ['add', 'remove', 'change', 'unchanged', 'sections', 'rules', 'invariants']         

                           
                  
            
                
                
                                  
                 
            
                     
                
                    
                     
 
