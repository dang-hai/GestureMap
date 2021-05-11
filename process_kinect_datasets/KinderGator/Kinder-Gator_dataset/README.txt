Description
---------
This is the Kinder-Gator motion dataset. The data set contains the motion of untrained actors (10 adults and 10 children) performing 58 different actions tracked using the Kinect v1.0.  This is an anonymized dataset for use in animation and whole-body recognition and interaction. The motions in the dataset have been categorized to consider motions that are easy to perform and used in day-to-day activities (warm-up), motions that induce exertion when performed and are commonly used in exercise and fitness activities (exercise), motions that involve the conceptualization of imaginary objects (mime), and motions that are used to convey information to other people (communication). 

Demographics
------------
ChildID    Sex      Age     Handedness    Grade       ||       AdultID     Sex      Age    Handedness     EducationCompleted
______________________________________________________________________________________________________________________________
337         F       5       B             Pre-K       ||        565         F       19      R             High school
595         M       5       B             Pre-K       ||        577         F       19      R             Some college
106         M       6       R             K           ||        604         F       20      R             Some college
290         M       6       R             K           ||        976         M       20      R             Some college
342         F       6       R             K           ||        734         M       22      R             Undergrad
474         F       6       R             1           ||        876         F       23      R             Undergrad
169         M       8       R             2           ||        921         M       26      L             Undergrad
103         F       8       R             3           ||        888         F       25      R             Grad   
723         M       8       R             3           ||        934         M       32      R             Grad
644         F       9       R             4           ||        970         M       28      R             Grad                                                   
Motion Set
-----------
Warm-up                     Exercise                              Mime                                    Communication
____________________________________________________________________________________________________________________________________
Raise your hand             Put your hands on your hip            Push an imaginary button in front       Point at the camera
                            and lean to the side                  of you     
Raise your other hand       Put your hands on your hips and       Swipe across an imaginary screen in     Motion someone to stop
                            lean to the other side                front of you                                                
Wave your hand              Put your hands on your hips and       Swipe across an imaginary screen in     Motion someone to come here
                            twist back and forth                  front of you with your other hand
Wave your other hand        Touch your toes                       Fly like a bird                         Draw a (circle, square, Triangle) in the air
Bow                         Do a forward lunge                    Fly like an airplane                    Draw the letter (A, C, K, M, X) in the air
Raise your arm to one side  Lift your leg to one side             Swim                                    Make the letter (Y, M, C, A, K, P, T, X) with your body
Raise your other arm to     Lift your other leg to the            Kick a ball
the other side              other side
Bend your knee              Walk in place                         Kick a ball as hard as you can
Bend your other knee        Walk in place as fast as you can      Kick a ball with the other leg
                            Run in place                          Kick a ball as hard as you can with that leg
                            Run in place as fast as you can       Throw a ball
                            Jump                                  Throw a ball as far as you can
                            Jump as high as you can               Throw a ball with your other arm
                            Do five jumping jacks                 Throw a ball as far as you can with that arm
                                                                  Punch
                                                                  Climb an imaginary ladder
                                                                  
Data Collection
-----------------
Twenty participants performed 58 motions. A total of 19 RGB videos and 1159 motion trials (58 motions x 20 participants); RGB video for AdultID: 934 and motion trial for jump high for AdultID:565 are missing due to a software error. Participants were allowed to perform the motions in free-form to ensure that the motions are as natural as possible. However, an example of the motion was demonstrated to participants if they forgot how the motion was to be performed. Motions were demonstrated for 4 child participants (11 actions) and 2 adult participants (2 actions): (Child IDs: 106 (2 actions - forward lunge, put your hands on your hip and lean to the side), 290 (6 actions - raise your arm to one side, bend your knee, swipe across an imaginary screen in front of you, fly like a bird, point at the camera, forward lunge), 337 (4 actions - bend your knee, lift your leg to one side, make the letter (M, K) with your body), 342 (2 actions - make the letter (A, K) with your body) and Adult IDs: 888-(1 action - forward lunge), 921-2 actions (forward lunge, make the letter M with your body)). To counterbalance the motions performed in the study, participants performed one of six sets. The sets contain the ordering of the categories. Each set began with the warm-up motions since these motions are used to situate the participants in the study and the order of the remaining three categories were counterbalanced, thus creating six sets (see below). 
  
SET#                ORDER
__________________________________________________________________
1                   Warm-up, Exercise, Communication, Mime
2                   Warm-up, Exercise, Mime, Communication
3                   Warm-up, Mime, Exercise, Communication
4                   Warm-up, Mime, Communication, Exercise
5                   Warm-up, Communication, Exercise, Mime
6                   Warm-up, Communication, Mime, Exercise



ChildID              SET#             ||            AdultID               SET#
_________________________________________________________________________________
337                   3                ||            565                   1
595                   4                ||            577                   2
106                   1                ||            604                   6
290                   4                ||            976                   4
342                   6                ||            734                   3
474                   2                ||            876                   5
169                   2                ||            921                   1
103                   4                ||            888                   3
723                   6                ||            970                   2
644                   5                ||            934                   1

Data Format
-----------------
The dataset is organized into RGB videos and skeleton data. Each RGB video includes all 58 motions performed by a participant. Data in the dataset has been labeled according to the category of the participant (child, adult). Within each category, the data has been labeled in the form of "POSE-PID_motion#-motionName-Timestamp.csv." PID is the participant id which is unique for each participant. motion# is the number of the motion labeled 01--58 according to the order the motion was performed. motionName is the name of the motion being performed. Timestamp is the UNIX timestamp representing the date and time the motion was performed. 
