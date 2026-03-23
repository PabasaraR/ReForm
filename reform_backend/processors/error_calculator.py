# processors/error_calculator.py
import numpy as np

class ErrorCalculator:

    def reconstruction_error_and_direction(self, X, reconstructed_data):

        # find difference between original data and reconstructed data
        difference = X - reconstructed_data

        # calculate error for each feature using mean squared error over time                       
        err_seq_feat = np.mean(difference ** 2, axis=1)    

        # calculate average direction of error (positive or negative)       
        dir_seq_feat = np.mean(difference, axis=1)                

        return err_seq_feat, dir_seq_feat
    