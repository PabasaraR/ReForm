# processors/error_calculator.py
import numpy as np

class ErrorCalculator:

    def reconstruction_error_and_direction(self, X, reconstructed_data):

        difference = X - reconstructed_data                       # signed difference
        err_seq_feat = np.mean(difference ** 2, axis=1)           # mse per feature
        dir_seq_feat = np.mean(difference, axis=1)                # mean signed direction

        return err_seq_feat, dir_seq_feat
    